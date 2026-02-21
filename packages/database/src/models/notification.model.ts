import mongoose, { Schema } from 'mongoose';
import { Notification } from '@owl-mentors/types';

export interface INotificationDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  channel: string;
  status: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  scheduledAt: Date;
  sentAt?: Date;
  readAt?: Date;
  attempts: number;
  lastAttemptAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['meeting_reminder', 'meeting_confirmed', 'meeting_cancelled', 'meeting_rescheduled', 'new_message', 'review_request', 'system'],
      required: true,
    },
    channel: { type: String, enum: ['email', 'push', 'sms'], required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'cancelled'], default: 'pending' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    scheduledAt: { type: Date, required: true },
    sentAt: { type: Date },
    readAt: { type: Date },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ status: 1, scheduledAt: 1 });

export const NotificationModel = mongoose.model<INotificationDocument>('Notification', notificationSchema);

export function toNotification(doc: INotificationDocument): Notification {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type as any,
    channel: doc.channel as any,
    status: doc.status as any,
    title: doc.title,
    message: doc.message,
    data: doc.data,
    scheduledAt: doc.scheduledAt,
    sentAt: doc.sentAt,
    readAt: doc.readAt,
    attempts: doc.attempts,
    lastAttemptAt: doc.lastAttemptAt,
    error: doc.error,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Legacy compat
export type NotificationDocument = INotificationDocument;
export function toNotificationDocument(n: any) { return n; }
