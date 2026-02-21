import mongoose from 'mongoose';
import { Offer, CreateOfferInput, UpdateOfferInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { OfferModel, toOffer } from '../models/offer.model';

export class OfferRepository {
  async create(mentorId: string, data: CreateOfferInput): Promise<Offer> {
    const startTime = Date.now();
    try {
      const doc = await OfferModel.create({
        mentorId: new mongoose.Types.ObjectId(mentorId),
        title: data.title,
        description: data.description,
        durationMinutes: data.durationMinutes,
        price: data.price,
        currency: data.currency || 'USD',
        isActive: data.isActive !== undefined ? data.isActive : true,
      });
      logger.db({ operation: 'insert', collection: 'offers', duration: Date.now() - startTime });
      return toOffer(doc);
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'offers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findById(id: string): Promise<Offer> {
    const startTime = Date.now();
    try {
      const doc = await OfferModel.findById(id);
      logger.db({ operation: 'findOne', collection: 'offers', duration: Date.now() - startTime });
      if (!doc) throw new Error('Offer not found');
      return toOffer(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'offers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByMentorId(mentorId: string): Promise<Offer[]> {
    const startTime = Date.now();
    try {
      const docs = await OfferModel.find({ mentorId: new mongoose.Types.ObjectId(mentorId) });
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
      const doc = await OfferModel.findByIdAndUpdate(id, { $set: data }, { new: true });
      logger.db({ operation: 'update', collection: 'offers', duration: Date.now() - startTime });
      if (!doc) throw new Error('Offer not found');
      return toOffer(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'offers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const startTime = Date.now();
    try {
      await OfferModel.findByIdAndDelete(id);
      logger.db({ operation: 'delete', collection: 'offers', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'delete', collection: 'offers', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
