import { ObjectId } from 'mongodb';
import { Notification } from '@mentor-app/types';

export interface NotificationDocument extends Omit<Notification, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  _id: ObjectId;
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export function toNotification(doc: NotificationDocument): Notification {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    channel: doc.channel,
    status: doc.status,
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

export function toNotificationDocument(notification: Partial<Notification>): Partial<NotificationDocument> {
  const doc: any = { ...notification };

  if (notification.id) {
    doc._id = new ObjectId(notification.id);
    delete doc.id;
  }

  if (notification.userId) {
    doc.userId = new ObjectId(notification.userId);
  }

  return doc;
}
