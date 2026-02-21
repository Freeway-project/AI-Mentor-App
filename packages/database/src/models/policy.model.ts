import mongoose, { Schema } from 'mongoose';
import { Policy } from '@owl-mentors/types';

export interface IPolicyDocument extends mongoose.Document {
  mentorId: mongoose.Types.ObjectId;
  cancellationHours: number;
  rescheduleHours: number;
  noShowPolicy?: string;
  customTerms?: string;
  createdAt: Date;
  updatedAt: Date;
}

const policySchema = new Schema<IPolicyDocument>(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true, unique: true },
    cancellationHours: { type: Number, required: true },
    rescheduleHours: { type: Number, required: true },
    noShowPolicy: { type: String },
    customTerms: { type: String },
  },
  { timestamps: true }
);

export const PolicyModel = mongoose.model<IPolicyDocument>('Policy', policySchema);

export function toPolicy(doc: IPolicyDocument): Policy {
  return {
    id: doc._id.toString(),
    mentorId: doc.mentorId.toString(),
    cancellationHours: doc.cancellationHours,
    rescheduleHours: doc.rescheduleHours,
    noShowPolicy: doc.noShowPolicy,
    customTerms: doc.customTerms,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Legacy compat
export type PolicyDocument = IPolicyDocument;
