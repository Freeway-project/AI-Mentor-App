import mongoose, { Schema } from 'mongoose';
import { Offer } from '@owl-mentors/types';

export interface IOfferDocument extends mongoose.Document {
  mentorId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  durationMinutes: number;
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOfferDocument>(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true },
    title: { type: String, required: true },
    description: { type: String },
    durationMinutes: { type: Number, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

offerSchema.index({ mentorId: 1 });
offerSchema.index({ mentorId: 1, isActive: 1 });

export const OfferModel = mongoose.model<IOfferDocument>('Offer', offerSchema);

export function toOffer(doc: IOfferDocument): Offer {
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

// Legacy compat
export type OfferDocument = IOfferDocument;
