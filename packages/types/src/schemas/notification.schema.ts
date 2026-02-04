import { z } from 'zod';

export const notificationTypeEnum = z.enum([
  'meeting_reminder',
  'meeting_confirmed',
  'meeting_cancelled',
  'meeting_rescheduled',
  'new_message',
  'review_request',
  'system',
]);

export const notificationStatusEnum = z.enum([
  'pending',
  'sent',
  'failed',
  'cancelled',
]);

export const notificationChannelEnum = z.enum(['email', 'push', 'sms']);

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: notificationTypeEnum,
  channel: notificationChannelEnum,
  status: notificationStatusEnum,
  title: z.string().max(200),
  message: z.string().max(1000),
  data: z.record(z.any()).optional(), // Additional data as JSON
  scheduledAt: z.date(),
  sentAt: z.date().optional(),
  readAt: z.date().optional(),
  attempts: z.number().int().nonnegative().default(0),
  lastAttemptAt: z.date().optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationType = z.infer<typeof notificationTypeEnum>;
export type NotificationStatus = z.infer<typeof notificationStatusEnum>;
export type NotificationChannel = z.infer<typeof notificationChannelEnum>;

export const createNotificationSchema = z.object({
  userId: z.string(),
  type: notificationTypeEnum,
  channel: notificationChannelEnum.default('email'),
  title: z.string().max(200),
  message: z.string().max(1000),
  data: z.record(z.any()).optional(),
  scheduledAt: z.string().datetime().optional(), // Defaults to now if not provided
});

export const updateNotificationSchema = z.object({
  status: notificationStatusEnum.optional(),
  readAt: z.string().datetime().optional(),
});

export const listNotificationsSchema = z.object({
  type: notificationTypeEnum.optional(),
  status: notificationStatusEnum.optional(),
  unreadOnly: z.boolean().default(false),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
