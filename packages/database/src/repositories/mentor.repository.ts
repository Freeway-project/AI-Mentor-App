import mongoose from 'mongoose';
import { Mentor, UpdateMentorInput, SearchMentorsInput, OnboardingStep, Availability, ApprovalStatus } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { MentorModel, toMentor } from '../models/mentor.model';

export class MentorRepository {
  async create(data: { userId: string; name: string }): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const doc = await MentorModel.create({
        userId: new mongoose.Types.ObjectId(data.userId),
        name: data.name,
        specialties: [],
        expertise: [],
        topicIds: [],
        languages: ['English'],
        totalMeetings: 0,
        totalReviews: 0,
        verified: false,
        isActive: false,
        onboardingStep: 'profile',
        approvalStatus: 'pending',
      });
      logger.db({ operation: 'insert', collection: 'providers', duration: Date.now() - startTime });
      return toMentor(doc);
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findById(id: string): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const doc = await MentorModel.findById(id);
      logger.db({ operation: 'findOne', collection: 'providers', duration: Date.now() - startTime });
      if (!doc) throw new Error('Mentor not found');
      return toMentor(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Mentor | null> {
    const startTime = Date.now();
    try {
      const doc = await MentorModel.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      logger.db({ operation: 'findOne', collection: 'providers', duration: Date.now() - startTime });
      return doc ? toMentor(doc) : null;
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async search(params: SearchMentorsInput): Promise<Mentor[]> {
    const startTime = Date.now();
    try {
      const filter: any = { isActive: true };

      if (params.specialties && params.specialties.length > 0) {
        filter.specialties = { $in: params.specialties };
      }
      if (params.languages && params.languages.length > 0) {
        filter.languages = { $in: params.languages };
      }
      if (params.minRating) {
        filter.rating = { $gte: params.minRating };
      }
      if (params.maxRate) {
        filter.hourlyRate = { $lte: params.maxRate };
      }
      if (params.query) {
        filter.$text = { $search: params.query };
      }

      const docs = await MentorModel.find(filter).skip(params.offset || 0).limit(params.limit || 20);
      logger.db({ operation: 'find', collection: 'providers', duration: Date.now() - startTime });
      return docs.map(toMentor);
    } catch (error) {
      logger.db({ operation: 'find', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async update(id: string, data: UpdateMentorInput): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const doc = await MentorModel.findByIdAndUpdate(id, { $set: data }, { new: true });
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
      if (!doc) throw new Error('Mentor not found');
      return toMentor(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async updateAvailability(id: string, availability: Availability): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const doc = await MentorModel.findByIdAndUpdate(id, { $set: { availability } }, { new: true });
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
      if (!doc) throw new Error('Mentor not found');
      return toMentor(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async updateOnboardingStep(id: string, step: OnboardingStep): Promise<void> {
    const startTime = Date.now();
    try {
      await MentorModel.findByIdAndUpdate(id, { $set: { onboardingStep: step } });
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async publish(id: string): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const doc = await MentorModel.findByIdAndUpdate(
        id,
        { $set: { isActive: true, onboardingStep: 'published' } },
        { new: true }
      );
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
      if (!doc) throw new Error('Mentor not found');
      return toMentor(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async unpublish(id: string): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const doc = await MentorModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
      if (!doc) throw new Error('Mentor not found');
      return toMentor(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async updateRating(id: string, rating: number, totalReviews: number): Promise<void> {
    const startTime = Date.now();
    try {
      await MentorModel.findByIdAndUpdate(id, { $set: { rating, totalReviews } });
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findAll(filter: { isActive?: boolean; approvalStatus?: ApprovalStatus } = {}, limit = 20, offset = 0): Promise<{ mentors: Mentor[]; total: number }> {
    const startTime = Date.now();
    try {
      const query: any = {};
      if (filter.isActive !== undefined) query.isActive = filter.isActive;
      if (filter.approvalStatus !== undefined) query.approvalStatus = filter.approvalStatus;

      const [docs, total] = await Promise.all([
        MentorModel.find(query).skip(offset).limit(limit),
        MentorModel.countDocuments(query),
      ]);
      logger.db({ operation: 'find', collection: 'providers', duration: Date.now() - startTime });
      return { mentors: docs.map(toMentor), total };
    } catch (error) {
      logger.db({ operation: 'find', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async approve(id: string, adminUserId: string, note?: string): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const updateData: any = {
        approvalStatus: 'approved',
        isActive: true,
        approvedAt: new Date(),
        approvedBy: new mongoose.Types.ObjectId(adminUserId),
      };
      if (note) updateData.approvalNote = note;

      const doc = await MentorModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
      if (!doc) throw new Error('Mentor not found');
      return toMentor(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async reject(id: string, adminUserId: string, note: string): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const doc = await MentorModel.findByIdAndUpdate(
        id,
        {
          $set: {
            approvalStatus: 'rejected',
            approvalNote: note,
            approvedBy: new mongoose.Types.ObjectId(adminUserId),
          },
        },
        { new: true }
      );
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
      if (!doc) throw new Error('Mentor not found');
      return toMentor(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findPendingApproval(limit = 20, offset = 0): Promise<{ mentors: Mentor[]; total: number }> {
    return this.findAll({ approvalStatus: 'pending' }, limit, offset);
  }

  async findFeatured(limit = 10): Promise<Mentor[]> {
    const startTime = Date.now();
    try {
      const docs = await MentorModel.find({
        isActive: true,
        approvalStatus: 'approved'
      })
        .sort({ rating: -1, totalMeetings: -1 })
        .limit(limit);

      logger.db({ operation: 'findFeatured', collection: 'providers', duration: Date.now() - startTime });
      return docs.map(toMentor);
    } catch (error) {
      logger.db({ operation: 'findFeatured', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
