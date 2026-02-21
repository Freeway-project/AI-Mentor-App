import { z } from 'zod';

export const otpTypeEnum = z.enum(['email', 'phone']);

export const otpSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: otpTypeEnum,
  target: z.string(), // email address or phone number
  code: z.string().length(6),
  expiresAt: z.date(),
  verified: z.boolean().default(false),
  createdAt: z.date(),
});

export const sendOtpSchema = z.object({
  type: otpTypeEnum,
});

export const verifyOtpSchema = z.object({
  type: otpTypeEnum,
  code: z.string().length(6),
});

export const mentorRegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(100),
  timezone: z.string().optional(),
});

export type Otp = z.infer<typeof otpSchema>;
export type OtpType = z.infer<typeof otpTypeEnum>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type MentorRegisterInput = z.infer<typeof mentorRegisterSchema>;
