import { Collection, ObjectId } from 'mongodb';
import { Meeting, CreateMeetingInput, UpdateMeetingInput, MeetingStatus, ListMeetingsInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { getDatabase } from '../connection';
import { MeetingDocument, toMeeting } from '../models/meeting.model';

export class MeetingRepository {
  private collection: Collection<MeetingDocument>;

  constructor() {
    this.collection = getDatabase().collection<MeetingDocument>('meetings');
  }

  async create(menteeId: string, data: CreateMeetingInput): Promise<Meeting> {
    const startTime = Date.now();
    try {
      const doc: Partial<MeetingDocument> = {
        menteeId: new ObjectId(menteeId),
        mentorId: new ObjectId(data.mentorId),
        title: data.title,
        description: data.description,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.collection.insertOne(doc as MeetingDocument);
      logger.db({ operation: 'insert', collection: 'meetings', duration: Date.now() - startTime });

      return this.findById(result.insertedId.toString());
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findById(id: string): Promise<Meeting> {
    const startTime = Date.now();
    try {
      const doc = await this.collection.findOne({ _id: new ObjectId(id) });
      logger.db({ operation: 'findOne', collection: 'meetings', duration: Date.now() - startTime });

      if (!doc) {
        throw new Error('Meeting not found');
      }

      return toMeeting(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async list(userId: string, params: ListMeetingsInput): Promise<Meeting[]> {
    const startTime = Date.now();
    try {
      const filter: any = {
        $or: [
          { menteeId: new ObjectId(userId) },
          { mentorId: new ObjectId(userId) },
        ],
      };

      if (params.status) {
        filter.status = params.status;
      }

      if (params.startDate) {
        filter.scheduledAt = { $gte: new Date(params.startDate) };
      }

      if (params.endDate) {
        filter.scheduledAt = {
          ...filter.scheduledAt,
          $lte: new Date(params.endDate),
        };
      }

      const docs = await this.collection
        .find(filter)
        .sort({ scheduledAt: -1 })
        .skip(params.offset || 0)
        .limit(params.limit || 20)
        .toArray();

      logger.db({ operation: 'find', collection: 'meetings', duration: Date.now() - startTime });

      return docs.map(toMeeting);
    } catch (error) {
      logger.db({ operation: 'find', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async update(id: string, data: UpdateMeetingInput): Promise<Meeting> {
    const startTime = Date.now();
    try {
      const updateData: any = { ...data };
      if (data.scheduledAt) {
        updateData.scheduledAt = new Date(data.scheduledAt);
      }

      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime });

      if (!result) {
        throw new Error('Meeting not found');
      }

      return toMeeting(result);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async updateStatus(id: string, status: MeetingStatus): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date() } }
      );
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async cancel(id: string, userId: string, reason: string): Promise<Meeting> {
    const startTime = Date.now();
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: 'cancelled',
            cancelledBy: new ObjectId(userId),
            cancelledAt: new Date(),
            cancellationReason: reason,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime });

      if (!result) {
        throw new Error('Meeting not found');
      }

      return toMeeting(result);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async rate(id: string, rating: number, review?: string): Promise<Meeting> {
    const startTime = Date.now();
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { rating, review, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime });

      if (!result) {
        throw new Error('Meeting not found');
      }

      return toMeeting(result);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
