import { ObjectId } from 'mongodb';
import { Offer } from '@owl-mentors/types';

export interface OfferDocument extends Omit<Offer, 'id' | 'mentorId' | 'createdAt' | 'updatedAt'> {
  _id: ObjectId;
  mentorId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export function toOffer(doc: OfferDocument): Offer {
  return {
    id: doc._id.toString(),
    mentorId: doc.mentorId.toString(),
    title: doc.title,
    description: doc.description,
    durationMinutes: doc.durationMinutes,
    price: doc.price,
    currency: doc.currency,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
