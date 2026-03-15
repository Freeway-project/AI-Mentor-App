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
        onboardingStep: 'basics',
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
        const re = new RegExp(params.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
          { headline: re },
          { bio: re },
          { specialties: re },
          { expertise: re },
          { name: re },
        ];
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
      // Mark as submitted for review — isActive stays false until admin approves
      const doc = await MentorModel.findByIdAndUpdate(
        id,
        { $set: { isActive: false, onboardingStep: 'published', approvalStatus: 'pending' } },
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
    const startTime = Date.now();
    try {
      // Only show mentors who have fully submitted (onboardingStep === 'published') and await admin review
      const query = { onboardingStep: 'published', approvalStatus: 'pending' };
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

  async addCertification(
    mentorId: string,
    cert: { name: string; fileUrl: string; fileKey: string },
  ): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const doc = await MentorModel.findByIdAndUpdate(
        mentorId,
        { $push: { certifications: { ...cert, uploadedAt: new Date() } } },
        { new: true },
      );
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
      if (!doc) throw new Error('Mentor not found');
      return toMentor(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async removeCertification(mentorId: string, fileKey: string): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const doc = await MentorModel.findByIdAndUpdate(
        mentorId,
        { $pull: { certifications: { fileKey } } },
        { new: true },
      );
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
      if (!doc) throw new Error('Mentor not found');
      return toMentor(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async updateIntroVideo(mentorId: string, url: string, key: string): Promise<void> {
    const startTime = Date.now();
    try {
      await MentorModel.findByIdAndUpdate(mentorId, { $set: { introVideoUrl: url, introVideoKey: key } });
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async clearIntroVideo(mentorId: string): Promise<void> {
    const startTime = Date.now();
    try {
      await MentorModel.findByIdAndUpdate(mentorId, { $unset: { introVideoUrl: '', introVideoKey: '' } });
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Persist a pre-computed embedding vector for a mentor profile.
   * Called by EmbeddingService after generating the vector from Voyage AI.
   *
   * @param id - Mentor document ID
   * @param embedding - float[1024] from voyage-3
   */
  async updateEmbedding(id: string, embedding: number[]): Promise<void> {
    const startTime = Date.now();
    try {
      await MentorModel.findByIdAndUpdate(id, {
        $set: { profileEmbedding: embedding, embeddingUpdatedAt: new Date() },
      });
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Atlas Vector Search — return mentors whose profileEmbedding is semantically closest
   * to the given query vector (cosine similarity).
   *
   * Requires a Vector Search index named "mentor_vector_index" on the providers collection.
   * Create it once via Atlas UI → Search → Create Index → JSON Editor:
   * {
   *   "name": "mentor_vector_index",
   *   "type": "vectorSearch",
   *   "fields": [{ "type": "vector", "path": "profileEmbedding", "numDimensions": 1024, "similarity": "cosine" }]
   * }
   *
   * @param queryEmbedding - float[1024] embedding of the user's search query
   * @param limit - max number of results to return (default: 10)
   * @returns Mentors sorted by semantic similarity (most relevant first), with matchScore attached
   */
  async vectorSearch(queryEmbedding: number[], limit = 10): Promise<(Mentor & { matchScore?: number })[]> {
    const startTime = Date.now();
    try {
      const docs = await MentorModel.aggregate([
        {
          $vectorSearch: {
            index: 'mentor_vector_index',
            path: 'profileEmbedding',
            queryVector: queryEmbedding,
            numCandidates: limit * 10, // oversample for post-filter accuracy
            limit: limit * 2,          // fetch extra before filter
          },
        },
        // Post-filter: only surface active, approved mentors
        { $match: { isActive: true, approvalStatus: 'approved' } },
        { $limit: limit },
        // Attach the cosine similarity score (0.0–1.0) as matchScore
        { $addFields: { matchScore: { $meta: 'vectorSearchScore' } } },
        // Never return the raw embedding vector to the client
        { $project: { profileEmbedding: 0 } },
      ]);

      logger.db({ operation: 'vectorSearch', collection: 'providers', duration: Date.now() - startTime });
      return docs.map(doc => ({ ...toMentor(doc as any), matchScore: doc.matchScore }));
    } catch (error) {
      logger.db({ operation: 'vectorSearch', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
