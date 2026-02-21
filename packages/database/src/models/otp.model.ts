import mongoose, { Schema } from 'mongoose';
import { Otp } from '@owl-mentors/types';

export interface IOtpDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: 'email' | 'phone';
  target: string;
  code: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

const otpSchema = new Schema<IOtpDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['email', 'phone'], required: true },
    target: { type: String, required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index: MongoDB auto-deletes documents after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ userId: 1, type: 1 });

export const OtpModel = mongoose.model<IOtpDocument>('Otp', otpSchema);

export function toOtp(doc: IOtpDocument): Otp {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    target: doc.target,
    code: doc.code,
    expiresAt: doc.expiresAt,
    verified: doc.verified,
    createdAt: doc.createdAt,
  };
}

export type OtpDocument = IOtpDocument;
