import { z } from 'zod';

export const userRoleEnum = z.enum(['mentee', 'mentor', 'admin']);

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).max(100),
  roles: z.array(userRoleEnum).min(1),
  avatar: z.string().url().optional(),
  timezone: z.string().default('UTC'),
  phone: z.string().optional(),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  oauthProviders: z.array(z.object({
    provider: z.string(),
    providerId: z.string(),
  })).optional(),
  resetToken: z.string().optional(),
  resetTokenExpiresAt: z.date().optional(),
  verifyToken: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;
export type UserRole = z.infer<typeof userRoleEnum>;

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
  role: userRoleEnum,
  timezone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateUserSchema = userSchema.partial().omit({
  id: true,
  password: true,
  createdAt: true,
  updatedAt: true,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
