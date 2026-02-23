import mongoose, { Schema } from 'mongoose';
import { Mentor, MentorCertification } from '@owl-mentors/types';

const availabilitySlotSchema = new Schema(
  {
    dayOfWeek: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const availabilitySchema = new Schema(
  {
    timezone: { type: String, required: true },
    schedule: [availabilitySlotSchema],
  },
  { _id: false }
);

export interface IMentorDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  headline?: string;
  bio?: string;
  specialties: string[];
  expertise: string[];
  topicIds: string[];
  languages: string[];
  hourlyRate?: number;
  availability?: {
    timezone: string;
    schedule: { dayOfWeek: number; startTime: string; endTime: string }[];
  };
  certifications: { name: string; fileUrl: string; fileKey: string; uploadedAt: Date }[];
  introVideoUrl?: string;
  introVideoKey?: string;
  rating?: number;
  totalMeetings: number;
  totalReviews: number;
  verified: boolean;
  isActive: boolean;
  onboardingStep: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNote?: string;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const certificationSubSchema = new Schema(
  {
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileKey: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const mentorSchema = new Schema<IMentorDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    headline: { type: String },
    bio: { type: String },
    specialties: { type: [String], default: [] },
    expertise: { type: [String], default: [] },
    topicIds: { type: [String], default: [] },
    languages: { type: [String], default: ['English'] },
    hourlyRate: { type: Number },
    availability: { type: availabilitySchema },
    certifications: { type: [certificationSubSchema], default: [] },
    introVideoUrl: { type: String },
    introVideoKey: { type: String },
    rating: { type: Number },
    totalMeetings: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    onboardingStep: {
      type: String,
      enum: ['basics', 'expertise', 'verification', 'offers', 'availability', 'review', 'published'],
      default: 'basics',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvalNote: { type: String },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

mentorSchema.index({ specialties: 1 });
mentorSchema.index({ expertise: 1 });
mentorSchema.index({ languages: 1 });
mentorSchema.index({ rating: -1 });
mentorSchema.index({ isActive: 1 });
mentorSchema.index({ onboardingStep: 1 });
mentorSchema.index({ approvalStatus: 1 });

export const MentorModel = mongoose.model<IMentorDocument>('Mentor', mentorSchema, 'providers');

export function toMentor(doc: IMentorDocument): Mentor {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    headline: doc.headline,
    bio: doc.bio,
    specialties: doc.specialties,
    expertise: doc.expertise,
    topicIds: doc.topicIds || [],
    languages: doc.languages,
    hourlyRate: doc.hourlyRate,
    availability: doc.availability,
    certifications: (doc.certifications || []).map(c => ({
      name: c.name,
      fileUrl: c.fileUrl,
      fileKey: c.fileKey,
      uploadedAt: c.uploadedAt,
    })),
    introVideoUrl: doc.introVideoUrl,
    introVideoKey: doc.introVideoKey,
    rating: doc.rating,
    totalMeetings: doc.totalMeetings,
    totalReviews: doc.totalReviews,
    verified: doc.verified,
    isActive: doc.isActive,
    onboardingStep: doc.onboardingStep as any,
    approvalStatus: doc.approvalStatus,
    approvalNote: doc.approvalNote,
    approvedAt: doc.approvedAt,
    approvedBy: doc.approvedBy?.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Legacy compat
export type MentorDocument = IMentorDocument;
export function toMentorDocument(mentor: any) { return mentor; }
