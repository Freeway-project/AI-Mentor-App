import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRepository, OtpRepository } from '@owl-mentors/database';
import {
  registerSchema, loginSchema, forgotPasswordSchema,
  resetPasswordSchema, verifyEmailSchema, googleAuthSchema,
  verifyOtpSchema, sendOtpSchema,
} from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { AppError } from '../middleware/error.middleware';
import { EmailService } from '../services/email.service';

const router: Router = Router();

let userRepo: UserRepository;
let otpRepo: OtpRepository;
function getUserRepo() {
  if (!userRepo) {
    userRepo = new UserRepository();
  }
  return userRepo;
}
function getOtpRepo() {
  if (!otpRepo) otpRepo = new OtpRepository();
  return otpRepo;
}

function generateToken(userId: string, email: string, roles: string[]) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(500, 'MISSING_JWT_SECRET', 'JWT_SECRET is not configured');
  }

  const expiresIn = normalizeJwtExpiresIn(process.env.JWT_EXPIRES_IN);
  const payload = { userId, email, roles };

  const options: jwt.SignOptions = {
    expiresIn,
  };

  return jwt.sign(payload, secret, options);
}

function normalizeJwtExpiresIn(value?: string): jwt.SignOptions['expiresIn'] {
  if (!value) return '7d';

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return value as jwt.SignOptions['expiresIn'];
}

// Register
router.post('/register', authRateLimit, validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role, timezone } = req.body;

    const existingUser = await getUserRepo().findByEmail(email);
    if (existingUser) {
      // If already verified, reject
      if (existingUser.emailVerified) {
        throw new AppError(409, 'USER_EXISTS', 'User with this email already exists');
      }
      // Unverified user — just resend OTP with a fresh token
      const emailCode = await getOtpRepo().createOtp(existingUser.id, 'email', existingUser.email);
      await EmailService.sendOtp(existingUser.email, emailCode);
      const token = generateToken(existingUser.id, existingUser.email, existingUser.roles);
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            roles: existingUser.roles,
            emailVerified: false,
          },
          token,
          nextStep: 'verify-email',
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await getUserRepo().create({
      email,
      password: hashedPassword,
      name,
      roles: [role],
      timezone,
      emailVerified: false,
    });

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
          roles: user.roles,
          emailVerified: false,
        },
        token,
        nextStep: 'verify-email',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Verify email OTP (mentee)
router.post('/verify-otp', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const { type, code } = parsed.data;
    if (type !== 'email') {
      throw new AppError(400, 'INVALID_TYPE', 'Only email OTP verification is supported');
    }

    const userId = req.userId!;
    const valid = await getOtpRepo().verifyOtp(userId, type, code);
    if (!valid) {
      throw new AppError(400, 'INVALID_OTP', 'Invalid or expired OTP code');
    }

    await getUserRepo().markEmailVerified(userId);
    const user = await getUserRepo().findById(userId);

    res.json({
      success: true,
      data: {
        verified: true,
        emailVerified: user.emailVerified,
        nextStep: 'browse',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Resend email OTP (mentee)
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

    if (user.emailVerified) {
      throw new AppError(400, 'ALREADY_VERIFIED', 'Email already verified');
    }

    const code = await getOtpRepo().createOtp(userId, 'email', user.email);
    await EmailService.sendOtp(user.email, code);

    res.json({ success: true, data: { message: 'OTP sent to your email' } });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', authRateLimit, validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await getUserRepo().findByEmail(email);
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended');
    }

    if (!user.password) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Please use Google sign-in for this account');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = generateToken(user.id, user.email, user.roles);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserRepo().findById(req.userId!);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        avatar: user.avatar,
        timezone: user.timezone,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Forgot password
router.post('/forgot-password', authRateLimit, validate(forgotPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await getUserRepo().findByEmail(email);

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await getUserRepo().setResetToken(user.id, resetToken, expiresAt);
      logger.info(`Password reset URL: /auth/reset-password?token=${resetToken}`);
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      data: { message: 'If an account exists with that email, a password reset link has been sent.' },
    });
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;

    const user = await getUserRepo().findByResetToken(token);
    if (!user) {
      throw new AppError(400, 'INVALID_TOKEN', 'Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await getUserRepo().resetPassword(user.id, hashedPassword);

    res.json({
      success: true,
      data: { message: 'Password has been reset successfully' },
    });
  } catch (error) {
    next(error);
  }
});

// Verify email
router.post('/verify-email', validate(verifyEmailSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    const user = await getUserRepo().findByVerifyToken(token);
    if (!user) {
      throw new AppError(400, 'INVALID_TOKEN', 'Invalid verification token');
    }

    await getUserRepo().verifyEmail(user.id);

    res.json({
      success: true,
      data: { message: 'Email verified successfully' },
    });
  } catch (error) {
    next(error);
  }
});

// Logout (client-side token clearing for MVP)
router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

// Google OAuth
router.post('/google', validate(googleAuthSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new AppError(500, 'CONFIG_ERROR', 'Google OAuth is not configured');
    }

    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid Google token');
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await getUserRepo().findByEmail(email);

    if (user) {
      if (!user.isActive) {
        throw new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended');
      }
    } else {
      user = await getUserRepo().create({
        email,
        name: name || email.split('@')[0],
        roles: ['mentee'],
        emailVerified: true,
        oauthProviders: [{ provider: 'google', providerId: googleId! }],
      });
    }

    const token = generateToken(user.id, user.email, user.roles);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          avatar: user.avatar || picture,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
