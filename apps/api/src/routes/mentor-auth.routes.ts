import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository, MentorRepository, OtpRepository } from '@owl-mentors/database';
import { mentorRegisterSchema, verifyOtpSchema, sendOtpSchema } from '@owl-mentors/types';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { EmailService } from '../services/email.service';
import { ReviewMessageModel, toReviewMessage } from '../../../../packages/database/src/models/review-message.model';
import { logger } from '@owl-mentors/utils';

const router: Router = Router();

let userRepo: UserRepository;
let mentorRepo: MentorRepository;
let otpRepo: OtpRepository;

function getUserRepo() { if (!userRepo) userRepo = new UserRepository(); return userRepo; }
function getMentorRepo() { if (!mentorRepo) mentorRepo = new MentorRepository(); return mentorRepo; }
function getOtpRepo() { if (!otpRepo) otpRepo = new OtpRepository(); return otpRepo; }

async function requireOwnMentorThread(userId: string, mentorId: string) {
  const mentor = await getMentorRepo().findByUserId(userId);
  if (!mentor) throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');
  if (mentor.id !== mentorId) throw new AppError(403, 'FORBIDDEN', 'You can only access your own review thread');
  return mentor;
}

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

    // Mentor profile is created after email verification to prevent duplicate provider records

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

    // Create mentor profile now that email is verified (idempotent — skip if already exists)
    const existingMentor = await getMentorRepo().findByUserId(userId);
    if (!existingMentor) {
      await getMentorRepo().create({ userId, name: user.name });
    }

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
        onboardingStep: mentor?.onboardingStep || 'basics',
        approvalStatus: mentor?.approvalStatus || 'pending',
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Review Chat (Mentor reads and replies to Admin) ──────────────────────────────────

// GET /mentor-auth/review-messages/:mentorId — get the review thread for this mentor
router.get('/review-messages/:mentorId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOwnMentorThread(req.userId!, req.params.mentorId);
    const msgs = await ReviewMessageModel
      .find({ mentorId: req.params.mentorId })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ success: true, data: (msgs as any[]).map(toReviewMessage) });
  } catch (error) { next(error); }
});

// POST /mentor-auth/review-messages/:mentorId — mentor sends a reply
router.post('/review-messages/:mentorId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await requireOwnMentorThread(req.userId!, req.params.mentorId);
    const { content } = req.body;
    if (!content?.trim()) throw new AppError(400, 'VALIDATION_ERROR', 'Message content is required');
    const trimmedContent = content.trim();
    const msg = await ReviewMessageModel.create({
      mentorId: req.params.mentorId,
      senderId: req.userId!,
      senderRole: 'mentor',
      content: trimmedContent,
      readByMentor: true,
      readByAdmin: false,
    });

    // Notify admin by email (non-blocking) that the mentor replied
    (async () => {
      try {
        const user = await getUserRepo().findById(req.userId!);
        await EmailService.notifyAdminReviewReply({
          mentorName: mentor.name || user.name,
          mentorEmail: user.email,
          mentorId: mentor.id,
          message: trimmedContent,
        });
      } catch (err) {
        logger.warn('Mentor review reply email notification failed', {
          mentorId: req.params.mentorId,
          userId: req.userId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();

    res.status(201).json({ success: true, data: toReviewMessage(msg) });
  } catch (error) { next(error); }
});

// PATCH /mentor-auth/review-messages/:mentorId/read — mark all admin messages as read
router.patch('/review-messages/:mentorId/read', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOwnMentorThread(_req.userId!, _req.params.mentorId);
    await ReviewMessageModel.updateMany(
      { mentorId: _req.params.mentorId, readByMentor: false },
      { $set: { readByMentor: true } }
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
