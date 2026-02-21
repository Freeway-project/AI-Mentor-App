import mongoose from 'mongoose';
import { Notification, CreateNotificationInput, UpdateNotificationInput, ListNotificationsInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { NotificationModel, toNotification } from '../models/notification.model';

export class NotificationRepository {
  async create(data: CreateNotificationInput): Promise<Notification> {
    const startTime = Date.now();
    try {
      const doc = await NotificationModel.create({
        userId: new mongoose.Types.ObjectId(data.userId),
        type: data.type,
        channel: data.channel,
        status: 'pending',
        title: data.title,
        message: data.message,
        data: data.data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
        attempts: 0,
      });
      logger.db({ operation: 'insert', collection: 'notifications', duration: Date.now() - startTime });
      return toNotification(doc);
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'notifications', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findById(id: string): Promise<Notification> {
    const startTime = Date.now();
    try {
      const doc = await NotificationModel.findById(id);
      logger.db({ operation: 'findOne', collection: 'notifications', duration: Date.now() - startTime });
      if (!doc) throw new Error('Notification not found');
      return toNotification(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'notifications', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async list(userId: string, params: ListNotificationsInput): Promise<Notification[]> {
    const startTime = Date.now();
    try {
      const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
      if (params.type) filter.type = params.type;
      if (params.status) filter.status = params.status;
      if (params.unreadOnly) filter.readAt = { $exists: false };

      const docs = await NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(params.offset || 0)
        .limit(params.limit || 20);
      logger.db({ operation: 'find', collection: 'notifications', duration: Date.now() - startTime });
      return docs.map(toNotification);
    } catch (error) {
      logger.db({ operation: 'find', collection: 'notifications', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findDueJobs(): Promise<Notification[]> {
    const startTime = Date.now();
    try {
      const docs = await NotificationModel.find({
        status: 'pending',
        scheduledAt: { $lte: new Date() },
      }).sort({ scheduledAt: 1 }).limit(100);
      logger.db({ operation: 'find', collection: 'notifications', duration: Date.now() - startTime });
      return docs.map(toNotification);
    } catch (error) {
      logger.db({ operation: 'find', collection: 'notifications', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async update(id: string, data: UpdateNotificationInput): Promise<Notification> {
    const startTime = Date.now();
    try {
      const updateData: any = { ...data };
      if (data.readAt) updateData.readAt = new Date(data.readAt);

      const doc = await NotificationModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      logger.db({ operation: 'update', collection: 'notifications', duration: Date.now() - startTime });
      if (!doc) throw new Error('Notification not found');
      return toNotification(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'notifications', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async markAsSent(id: string): Promise<void> {
    const startTime = Date.now();
    try {
      await NotificationModel.findByIdAndUpdate(id, { $set: { status: 'sent', sentAt: new Date() } });
      logger.db({ operation: 'update', collection: 'notifications', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'notifications', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    const startTime = Date.now();
    try {
      await NotificationModel.findByIdAndUpdate(id, {
        $set: { status: 'failed', error, lastAttemptAt: new Date() },
        $inc: { attempts: 1 },
      });
      logger.db({ operation: 'update', collection: 'notifications', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'notifications', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
