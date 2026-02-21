import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository, MentorRepository, OtpRepository } from '@owl-mentors/database';
import { mentorRegisterSchema, verifyOtpSchema, sendOtpSchema } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';

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

async function sendEmailOtp(email: string, code: string) {
  // In production: integrate with email service (SendGrid, Resend, etc.)
  // For now: log to console
  logger.info(`[OTP EMAIL] To: ${email} | Code: ${code} | Expires: 10 min`);
}

async function sendSmsOtp(phone: string, code: string) {
  // In production: integrate with Twilio, AWS SNS, etc.
  // For now: log to console
  logger.info(`[OTP SMS] To: ${phone} | Code: ${code} | Expires: 10 min`);
}

// POST /mentor-auth/register
// Creates user + mentor profile, sends email + phone OTP
router.post('/register', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = mentorRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const { name, email, phone, password, timezone } = parsed.data;

    const existing = await getUserRepo().findByEmail(email);
    if (existing) {
      throw new AppError(409, 'USER_EXISTS', 'An account with this email already exists');
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

    // Generate and send OTPs
    const emailCode = await getOtpRepo().createOtp(user.id, 'email', email);
    const phoneCode = await getOtpRepo().createOtp(user.id, 'phone', phone);

    await sendEmailOtp(email, emailCode);
    await sendSmsOtp(phone, phoneCode);

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
          phoneVerified: user.phoneVerified,
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
// Verifies email or phone OTP for authenticated mentor
router.post('/verify-otp', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const { type, code } = parsed.data;
    const userId = req.userId!;

    const valid = await getOtpRepo().verifyOtp(userId, type, code);
    if (!valid) {
      throw new AppError(400, 'INVALID_OTP', 'Invalid or expired OTP code');
    }

    // Mark verified on user record
    if (type === 'email') {
      await getUserRepo().markEmailVerified(userId);
    } else {
      await getUserRepo().markPhoneVerified(userId);
    }

    const user = await getUserRepo().findById(userId);

    const bothVerified = user.emailVerified && user.phoneVerified;

    res.json({
      success: true,
      data: {
        type,
        verified: true,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        nextStep: bothVerified ? 'onboarding' : 'verify-otp',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /mentor-auth/resend-otp
// Resend OTP for email or phone
router.post('/resend-otp', authRateLimit, authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = sendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const { type } = parsed.data;
    const userId = req.userId!;
    const user = await getUserRepo().findById(userId);

    if (type === 'email') {
      if (user.emailVerified) throw new AppError(400, 'ALREADY_VERIFIED', 'Email already verified');
      const code = await getOtpRepo().createOtp(userId, 'email', user.email);
      await sendEmailOtp(user.email, code);
    } else {
      if (user.phoneVerified) throw new AppError(400, 'ALREADY_VERIFIED', 'Phone already verified');
      if (!user.phone) throw new AppError(400, 'NO_PHONE', 'No phone number on file');
      const code = await getOtpRepo().createOtp(userId, 'phone', user.phone);
      await sendSmsOtp(user.phone, code);
    }

    res.json({ success: true, data: { message: `OTP sent to your ${type}` } });
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
        phoneVerified: user.phoneVerified,
        bothVerified: user.emailVerified && user.phoneVerified,
        onboardingStep: mentor?.onboardingStep || 'profile',
        approvalStatus: mentor?.approvalStatus || 'pending',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
