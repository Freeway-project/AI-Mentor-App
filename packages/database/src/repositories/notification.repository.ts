import { Collection, ObjectId } from 'mongodb';
import { Notification, CreateNotificationInput, UpdateNotificationInput, ListNotificationsInput } from '@mentor-app/types';
import { logger } from '@mentor-app/utils';
import { getDatabase } from '../connection';
import { NotificationDocument, toNotification, toNotificationDocument } from '../models/notification.model';

export class NotificationRepository {
  private collection: Collection<NotificationDocument>;

  constructor() {
    this.collection = getDatabase().collection<NotificationDocument>('notifications');
  }

  async create(data: CreateNotificationInput): Promise<Notification> {
    const startTime = Date.now();
    try {
      const doc: Partial<NotificationDocument> = {
        userId: new ObjectId(data.userId),
        type: data.type,
        channel: data.channel,
        status: 'pending',
        title: data.title,
        message: data.message,
        data: data.data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.collection.insertOne(doc as NotificationDocument);
      logger.db({ operation: 'insert', collection: 'notifications', duration: Date.now() - startTime });

      return this.findById(result.insertedId.toString());
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'notifications', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findById(id: string): Promise<Notification> {
    const startTime = Date.now();
    try {
      const doc = await this.collection.findOne({ _id: new ObjectId(id) });
      logger.db({ operation: 'findOne', collection: 'notifications', duration: Date.now() - startTime });

      if (!doc) {
        throw new Error('Notification not found');
      }

      return toNotification(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'notifications', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async list(userId: string, params: ListNotificationsInput): Promise<Notification[]> {
    const startTime = Date.now();
    try {
      const filter: any = { userId: new ObjectId(userId) };

      if (params.type) {
        filter.type = params.type;
      }

      if (params.status) {
        filter.status = params.status;
      }

      if (params.unreadOnly) {
        filter.readAt = { $exists: false };
      }

      const docs = await this.collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(params.offset || 0)
        .limit(params.limit || 20)
        .toArray();

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
      const docs = await this.collection
        .find({
          status: 'pending',
          scheduledAt: { $lte: new Date() },
        })
        .sort({ scheduledAt: 1 })
        .limit(100)
        .toArray();

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
      if (data.readAt) {
        updateData.readAt = new Date(data.readAt);
      }

      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      logger.db({ operation: 'update', collection: 'notifications', duration: Date.now() - startTime });

      if (!result) {
        throw new Error('Notification not found');
      }

      return toNotification(result);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'notifications', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async markAsSent(id: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
      logger.db({ operation: 'update', collection: 'notifications', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'notifications', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: 'failed',
            error,
            lastAttemptAt: new Date(),
            updatedAt: new Date(),
          },
          $inc: { attempts: 1 },
        }
      );
      logger.db({ operation: 'update', collection: 'notifications', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'notifications', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
