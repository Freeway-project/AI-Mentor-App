import { z } from 'zod';

export const meetingStatusEnum = z.enum([
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]);

export const meetingSchema = z.object({
  id: z.string(),
  learnerId: z.string(),
  providerId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  scheduledAt: z.date(),
  duration: z.number().int().positive(), // in minutes
  status: meetingStatusEnum,
  meetingLink: z.string().url().optional(),
  notes: z.string().max(5000).optional(),
  rating: z.number().min(0).max(5).optional(),
  review: z.string().max(1000).optional(),
  cancelledBy: z.string().optional(),
  cancelledAt: z.date().optional(),
  cancellationReason: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Meeting = z.infer<typeof meetingSchema>;
export type MeetingStatus = z.infer<typeof meetingStatusEnum>;

export const createMeetingSchema = z.object({
  providerId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  scheduledAt: z.string().datetime(), // ISO 8601 string
  duration: z.number().int().positive().default(60),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().int().positive().optional(),
  notes: z.string().max(5000).optional(),
});

export const cancelMeetingSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const rateMeetingSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().max(1000).optional(),
});

export const listMeetingsSchema = z.object({
  status: meetingStatusEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type CancelMeetingInput = z.infer<typeof cancelMeetingSchema>;
export type RateMeetingInput = z.infer<typeof rateMeetingSchema>;
export type ListMeetingsInput = z.infer<typeof listMeetingsSchema>;
