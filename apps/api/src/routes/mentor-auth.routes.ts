import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository, MentorRepository, OtpRepository } from '@owl-mentors/database';
import { mentorRegisterSchema, verifyOtpSchema, sendOtpSchema } from '@owl-mentors/types';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { EmailService } from '../services/email.service';

const router: Router = Router();

let userRepo: UserRepository;
let mentorRepo: MentorRepository;
let otpRepo: OtpRepository;

function getUserRepo() { if (!userRepo) userRepo = new UserRepository(); return userRepo; }
function getMentorRepo() { if (!mentorRepo) mentorRepo = new MentorRepository(); return mentorRepo; }
function getOtpRepo() { if (!otpRepo) otpRepo = new OtpRepository(); return otpRepo; }

function generateToken(userId: string, email: string, roles: string[]) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError(500, 'MISSING_JWT_SECRET', 'JWT_SECRET is not configured');
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign({ userId, email, roles }, secret, { expiresIn });
}

// POST /mentor-auth/register
// Creates user + mentor profile, sends email OTP
router.post('/register', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = mentorRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const { name, email, phone, password, timezone } = parsed.data;

    const existing = await getUserRepo().findByEmail(email);
    if (existing) {
      // If already verified, reject
      if (existing.emailVerified) {
        throw new AppError(409, 'USER_EXISTS', 'An account with this email already exists');
      }
      // Unverified — resend OTP and return fresh token
      const emailCode = await getOtpRepo().createOtp(existing.id, 'email', existing.email);
      await EmailService.sendOtp(existing.email, emailCode);
      const token = generateToken(existing.id, existing.email, existing.roles);
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: existing.id,
            email: existing.email,
            name: existing.name,
            roles: existing.roles,
            emailVerified: false,
          },
          token,
          nextStep: 'verify-otp',
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await getUserRepo().create({
      email,
      password: hashedPassword,
      name,
      phone,
      roles: ['mentor'],
      timezone,
      emailVerified: false,
      phoneVerified: false,
    });

    // Create mentor profile (pending)
    await getMentorRepo().create({ userId: user.id, name });

    // Generate and send email OTP
    const emailCode = await getOtpRepo().createOtp(user.id, 'email', email);
    await EmailService.sendOtp(email, emailCode);

    const token = generateToken(user.id, user.email, user.roles);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          roles: user.roles,
          emailVerified: user.emailVerified,
        },
        token,
        nextStep: 'verify-otp',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /mentor-auth/verify-otp
// Verifies email OTP for authenticated mentor
router.post('/verify-otp', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const { type, code } = parsed.data;
    const userId = req.userId!;

    if (type !== 'email') {
      throw new AppError(400, 'INVALID_TYPE', 'Only email OTP verification is supported');
    }

    const valid = await getOtpRepo().verifyOtp(userId, type, code);
    if (!valid) {
      throw new AppError(400, 'INVALID_OTP', 'Invalid or expired OTP code');
    }

    await getUserRepo().markEmailVerified(userId);
    const user = await getUserRepo().findById(userId);

    // Notify admin of new verified mentor signup (non-blocking)
    EmailService.notifyAdminNewMentor({ name: user.name, email: user.email }).catch(() => { });

    res.json({
      success: true,
      data: {
        type,
        verified: true,
        emailVerified: user.emailVerified,
        nextStep: 'onboarding',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /mentor-auth/resend-otp
// Resend email OTP
router.post('/resend-otp', authRateLimit, authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = sendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const { type } = parsed.data;
    if (type !== 'email') {
      throw new AppError(400, 'INVALID_TYPE', 'Only email OTP is supported');
    }

    const userId = req.userId!;
    const user = await getUserRepo().findById(userId);

    if (user.emailVerified) throw new AppError(400, 'ALREADY_VERIFIED', 'Email already verified');

    const code = await getOtpRepo().createOtp(userId, 'email', user.email);
    await EmailService.sendOtp(user.email, code);

    res.json({ success: true, data: { message: 'OTP sent to your email' } });
  } catch (error) {
    next(error);
  }
});

// GET /mentor-auth/verification-status
router.get('/verification-status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserRepo().findById(req.userId!);
    const mentor = await getMentorRepo().findByUserId(req.userId!);

    res.json({
      success: true,
      data: {
        emailVerified: user.emailVerified,
        onboardingStep: mentor?.onboardingStep || 'profile',
        approvalStatus: mentor?.approvalStatus || 'pending',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
