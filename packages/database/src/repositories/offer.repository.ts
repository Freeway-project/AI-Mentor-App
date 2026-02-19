import { Collection, ObjectId } from 'mongodb';
import { Offer, CreateOfferInput, UpdateOfferInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { getDatabase } from '../connection';
import { OfferDocument, toOffer } from '../models/offer.model';

export class OfferRepository {
  private collection: Collection<OfferDocument>;

  constructor() {
    this.collection = getDatabase().collection<OfferDocument>('offers');
  }

  async create(mentorId: string, data: CreateOfferInput): Promise<Offer> {
    const startTime = Date.now();
    try {
      const doc: Partial<OfferDocument> = {
        mentorId: new ObjectId(mentorId),
        title: data.title,
        description: data.description,
        durationMinutes: data.durationMinutes,
        price: data.price,
        currency: data.currency || 'USD',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.collection.insertOne(doc as OfferDocument);
      logger.db({ operation: 'insert', collection: 'offers', duration: Date.now() - startTime });

      return this.findById(result.insertedId.toString());
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'offers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findById(id: string): Promise<Offer> {
    const startTime = Date.now();
    try {
      const doc = await this.collection.findOne({ _id: new ObjectId(id) });
      logger.db({ operation: 'findOne', collection: 'offers', duration: Date.now() - startTime });

      if (!doc) {
        throw new Error('Offer not found');
      }

      return toOffer(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'offers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByMentorId(mentorId: string): Promise<Offer[]> {
    const startTime = Date.now();
    try {
      const docs = await this.collection.find({ mentorId: new ObjectId(mentorId) }).toArray();
      logger.db({ operation: 'find', collection: 'offers', duration: Date.now() - startTime });

      return docs.map(toOffer);
    } catch (error) {
      logger.db({ operation: 'find', collection: 'offers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async update(id: string, data: UpdateOfferInput): Promise<Offer> {
    const startTime = Date.now();
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      logger.db({ operation: 'update', collection: 'offers', duration: Date.now() - startTime });

      if (!result) {
        throw new Error('Offer not found');
      }

      return toOffer(result);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'offers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.deleteOne({ _id: new ObjectId(id) });
      logger.db({ operation: 'delete', collection: 'offers', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'delete', collection: 'offers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
