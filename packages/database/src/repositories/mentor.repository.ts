import { Collection, ObjectId } from 'mongodb';
import { Mentor, UpdateMentorInput, SearchMentorsInput, OnboardingStep, Availability } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { getDatabase } from '../connection';
import { MentorDocument, toMentor, toMentorDocument } from '../models/mentor.model';

export class MentorRepository {
  private collection: Collection<MentorDocument>;

  constructor() {
    this.collection = getDatabase().collection<MentorDocument>('providers');
  }

  async create(data: { userId: string; name: string }): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const doc: Partial<MentorDocument> = {
        userId: new ObjectId(data.userId),
        name: data.name,
        specialties: [],
        expertise: [],
        languages: ['English'],
        totalMeetings: 0,
        totalReviews: 0,
        verified: false,
        isActive: false,
        onboardingStep: 'profile',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.collection.insertOne(doc as MentorDocument);
      logger.db({ operation: 'insert', collection: 'providers', duration: Date.now() - startTime });

      return this.findById(result.insertedId.toString());
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findById(id: string): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const doc = await this.collection.findOne({ _id: new ObjectId(id) });
      logger.db({ operation: 'findOne', collection: 'providers', duration: Date.now() - startTime });

      if (!doc) {
        throw new Error('Mentor not found');
      }

      return toMentor(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Mentor | null> {
    const startTime = Date.now();
    try {
      const doc = await this.collection.findOne({ userId: new ObjectId(userId) });
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

      const docs = await this.collection
        .find(filter)
        .skip(params.offset || 0)
        .limit(params.limit || 20)
        .toArray();

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
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });

      if (!result) {
        throw new Error('Mentor not found');
      }

      return toMentor(result);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async updateAvailability(id: string, availability: Availability): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { availability, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });

      if (!result) {
        throw new Error('Mentor not found');
      }

      return toMentor(result);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async updateOnboardingStep(id: string, step: OnboardingStep): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { onboardingStep: step, updatedAt: new Date() } }
      );
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async publish(id: string): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { isActive: true, onboardingStep: 'published', updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });

      if (!result) {
        throw new Error('Mentor not found');
      }

      return toMentor(result);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async unpublish(id: string): Promise<Mentor> {
    const startTime = Date.now();
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { isActive: false, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });

      if (!result) {
        throw new Error('Mentor not found');
      }

      return toMentor(result);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async updateRating(id: string, rating: number, totalReviews: number): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { rating, totalReviews, updatedAt: new Date() } }
      );
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findAll(filter: { isActive?: boolean } = {}, limit = 20, offset = 0): Promise<{ mentors: Mentor[]; total: number }> {
    const startTime = Date.now();
    try {
      const query: any = {};
      if (filter.isActive !== undefined) query.isActive = filter.isActive;

      const [docs, total] = await Promise.all([
        this.collection.find(query).skip(offset).limit(limit).toArray(),
        this.collection.countDocuments(query),
      ]);

      logger.db({ operation: 'find', collection: 'providers', duration: Date.now() - startTime });

      return { mentors: docs.map(toMentor), total };
    } catch (error) {
      logger.db({ operation: 'find', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
