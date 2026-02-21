import mongoose from 'mongoose';
import { Meeting, CreateMeetingInput, UpdateMeetingInput, MeetingStatus, ListMeetingsInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { MeetingModel, toMeeting } from '../models/meeting.model';

export class MeetingRepository {
  async create(menteeId: string, data: CreateMeetingInput & { creditCost?: number }): Promise<Meeting> {
    const startTime = Date.now();
    try {
      const doc = await MeetingModel.create({
        menteeId: new mongoose.Types.ObjectId(menteeId),
        mentorId: new mongoose.Types.ObjectId(data.mentorId),
        title: data.title,
        description: data.description,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        status: 'booked',
        creditCost: data.creditCost ?? (data.duration <= 30 ? 0.5 : 1.0),
        offerId: data.offerId,
      });
      logger.db({ operation: 'insert', collection: 'meetings', duration: Date.now() - startTime });
      return toMeeting(doc);
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findById(id: string): Promise<Meeting> {
    const startTime = Date.now();
    try {
      const doc = await MeetingModel.findById(id);
      logger.db({ operation: 'findOne', collection: 'meetings', duration: Date.now() - startTime });
      if (!doc) throw new Error('Meeting not found');
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
          { menteeId: new mongoose.Types.ObjectId(userId) },
          { mentorId: new mongoose.Types.ObjectId(userId) },
        ],
      };

      if (params.status) filter.status = params.status;
      if (params.startDate) filter.scheduledAt = { $gte: new Date(params.startDate) };
      if (params.endDate) {
        filter.scheduledAt = { ...filter.scheduledAt, $lte: new Date(params.endDate) };
      }

      const docs = await MeetingModel.find(filter)
        .sort({ scheduledAt: -1 })
        .skip(params.offset || 0)
        .limit(params.limit || 20);

      logger.db({ operation: 'find', collection: 'meetings', duration: Date.now() - startTime });
      return docs.map(toMeeting);
    } catch (error) {
      logger.db({ operation: 'find', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async listAll(params: ListMeetingsInput): Promise<{ meetings: Meeting[]; total: number }> {
    const startTime = Date.now();
    try {
      const filter: any = {};
      if (params.status) filter.status = params.status;
      if (params.mentorId) filter.mentorId = new mongoose.Types.ObjectId(params.mentorId);
      if (params.menteeId) filter.menteeId = new mongoose.Types.ObjectId(params.menteeId);
      if (params.startDate) filter.scheduledAt = { $gte: new Date(params.startDate) };
      if (params.endDate) {
        filter.scheduledAt = { ...filter.scheduledAt, $lte: new Date(params.endDate) };
      }

      const [docs, total] = await Promise.all([
        MeetingModel.find(filter).sort({ scheduledAt: -1 }).skip(params.offset || 0).limit(params.limit || 20),
        MeetingModel.countDocuments(filter),
      ]);
      logger.db({ operation: 'find', collection: 'meetings', duration: Date.now() - startTime });
      return { meetings: docs.map(toMeeting), total };
    } catch (error) {
      logger.db({ operation: 'find', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async update(id: string, data: UpdateMeetingInput): Promise<Meeting> {
    const startTime = Date.now();
    try {
      const updateData: any = { ...data };
      if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);

      const doc = await MeetingModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime });
      if (!doc) throw new Error('Meeting not found');
      return toMeeting(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async updateStatus(id: string, status: MeetingStatus): Promise<void> {
    const startTime = Date.now();
    try {
      await MeetingModel.findByIdAndUpdate(id, { $set: { status } });
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async cancel(id: string, userId: string, reason: string): Promise<Meeting> {
    const startTime = Date.now();
    try {
      const doc = await MeetingModel.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'cancelled',
            cancelledBy: new mongoose.Types.ObjectId(userId),
            cancelledAt: new Date(),
            cancellationReason: reason,
          },
        },
        { new: true }
      );
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime });
      if (!doc) throw new Error('Meeting not found');
      return toMeeting(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async rate(id: string, rating: number, review?: string): Promise<Meeting> {
    const startTime = Date.now();
    try {
      const doc = await MeetingModel.findByIdAndUpdate(id, { $set: { rating, review } }, { new: true });
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime });
      if (!doc) throw new Error('Meeting not found');
      return toMeeting(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async getStatusCounts(): Promise<Record<string, number>> {
    const startTime = Date.now();
    try {
      const results = await MeetingModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      logger.db({ operation: 'aggregate', collection: 'meetings', duration: Date.now() - startTime });
      return results.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});
    } catch (error) {
      logger.db({ operation: 'aggregate', collection: 'meetings', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
