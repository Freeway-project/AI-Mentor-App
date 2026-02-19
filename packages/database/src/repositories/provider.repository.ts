import { Collection, ObjectId } from 'mongodb';
import { Provider, CreateProviderInput, UpdateProviderInput, SearchProvidersInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { getDatabase } from '../connection';
import { ProviderDocument, toProvider, toProviderDocument } from '../models/provider.model';

export class ProviderRepository {
  private collection: Collection<ProviderDocument>;

  constructor() {
    this.collection = getDatabase().collection<ProviderDocument>('providers');
  }

  async create(data: CreateProviderInput): Promise<Provider> {
    const startTime = Date.now();
    try {
      const doc: Partial<ProviderDocument> = {
        ...toProviderDocument(data as any),
        totalMeetings: 0,
        totalReviews: 0,
        verified: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.collection.insertOne(doc as ProviderDocument);
      logger.db({ operation: 'insert', collection: 'providers', duration: Date.now() - startTime });

      return this.findById(result.insertedId.toString());
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findById(id: string): Promise<Provider> {
    const startTime = Date.now();
    try {
      const doc = await this.collection.findOne({ _id: new ObjectId(id) });
      logger.db({ operation: 'findOne', collection: 'providers', duration: Date.now() - startTime });

      if (!doc) {
        throw new Error('Provider not found');
      }

      return toProvider(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Provider | null> {
    const startTime = Date.now();
    try {
      const doc = await this.collection.findOne({ userId: new ObjectId(userId) });
      logger.db({ operation: 'findOne', collection: 'providers', duration: Date.now() - startTime });

      return doc ? toProvider(doc) : null;
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async search(params: SearchProvidersInput): Promise<Provider[]> {
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

      return docs.map(toProvider);
    } catch (error) {
      logger.db({ operation: 'find', collection: 'providers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async update(id: string, data: UpdateProviderInput): Promise<Provider> {
    const startTime = Date.now();
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      logger.db({ operation: 'update', collection: 'providers', duration: Date.now() - startTime });

      if (!result) {
        throw new Error('Provider not found');
      }

      return toProvider(result);
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
}
