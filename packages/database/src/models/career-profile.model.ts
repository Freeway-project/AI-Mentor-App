import mongoose, { Schema } from 'mongoose';
import { CareerProfile } from '@owl-mentors/types';

export interface ICareerProfileDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  status: 'idle' | 'ready' | 'failed';
  resume?: {
    fileUrl: string;
    fileKey: string;
    fileName: string;
    mimeType: string;
    uploadedAt: Date;
    textExtractedAt?: Date;
  };
  rawText?: string;
  extractedProfile?: {
    summary: string;
    headline?: string;
    coreCapabilities: string[];
    tools: string[];
    domains: string[];
    functionalSkills: string[];
    communicationSkills: string[];
    leadershipSignals: string[];
    careerInterests: string[];
    certifications: string[];
    projects: Array<{ name: string; summary?: string; capabilitiesUsed: string[] }>;
    education: Array<{ institution: string; degree?: string; fieldOfStudy?: string; graduationYear?: string }>;
    experienceTimeline: Array<{
      title: string;
      company?: string;
      startDate?: string;
      endDate?: string;
      isCurrent: boolean;
      summary?: string;
      capabilitiesUsed: string[];
    }>;
    seniorityEstimate: string;
    strengthSignals: string[];
    weakSignals: string[];
    confidence: number;
  };
  goalProfile?: {
    targetRole: string;
    goalType: string;
    timelineMonths?: number;
    priorityAreas: string[];
    inferredCurrentLevel?: string;
    constraints: {
      weeklyHours?: number;
      maxBudget?: number;
      preferredLanguage?: string;
    };
    confidence: number;
    goalSummary: string;
  };
  latestAnalysis?: {
    currentLevelSummary: string;
    topStrengths: string[];
    primaryGaps: string[];
    recommendedFocusAreas: string[];
    recommendedLearningOrder: string[];
    explorationSuggestions: string[];
    briefPlan: string;
    mentorSearchQuery: string;
    generatedAt: Date;
  };
  mentorRecommendations: Array<{
    mentorId: string;
    name: string;
    headline?: string;
    hourlyRate?: number;
    specialties: string[];
    matchScore?: number;
    matchReason?: string;
  }>;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema(
  {
    name: { type: String, required: true },
    summary: { type: String },
    capabilitiesUsed: { type: [String], default: [] },
  },
  { _id: false }
);

const educationSchema = new Schema(
  {
    institution: { type: String, required: true },
    degree: { type: String },
    fieldOfStudy: { type: String },
    graduationYear: { type: String },
  },
  { _id: false }
);

const timelineSchema = new Schema(
  {
    title: { type: String, required: true },
    company: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    isCurrent: { type: Boolean, default: false },
    summary: { type: String },
    capabilitiesUsed: { type: [String], default: [] },
  },
  { _id: false }
);

const careerProfileSchema = new Schema<ICareerProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    status: {
      type: String,
      enum: ['idle', 'ready', 'failed'],
      default: 'idle',
    },
    resume: {
      fileUrl: { type: String },
      fileKey: { type: String },
      fileName: { type: String },
      mimeType: { type: String },
      uploadedAt: { type: Date },
      textExtractedAt: { type: Date },
    },
    rawText: { type: String },
    extractedProfile: {
      summary: { type: String },
      headline: { type: String },
      coreCapabilities: { type: [String], default: [] },
      tools: { type: [String], default: [] },
      domains: { type: [String], default: [] },
      functionalSkills: { type: [String], default: [] },
      communicationSkills: { type: [String], default: [] },
      leadershipSignals: { type: [String], default: [] },
      careerInterests: { type: [String], default: [] },
      certifications: { type: [String], default: [] },
      projects: { type: [projectSchema], default: [] },
      education: { type: [educationSchema], default: [] },
      experienceTimeline: { type: [timelineSchema], default: [] },
      seniorityEstimate: { type: String },
      strengthSignals: { type: [String], default: [] },
      weakSignals: { type: [String], default: [] },
      confidence: { type: Number, default: 0.5 },
    },
    goalProfile: {
      targetRole: { type: String },
      goalType: { type: String },
      timelineMonths: { type: Number },
      priorityAreas: { type: [String], default: [] },
      inferredCurrentLevel: { type: String },
      constraints: {
        weeklyHours: { type: Number },
        maxBudget: { type: Number },
        preferredLanguage: { type: String },
      },
      confidence: { type: Number, default: 0.5 },
      goalSummary: { type: String },
    },
    latestAnalysis: {
      currentLevelSummary: { type: String },
      topStrengths: { type: [String], default: [] },
      primaryGaps: { type: [String], default: [] },
      recommendedFocusAreas: { type: [String], default: [] },
      recommendedLearningOrder: { type: [String], default: [] },
      explorationSuggestions: { type: [String], default: [] },
      briefPlan: { type: String },
      mentorSearchQuery: { type: String },
      generatedAt: { type: Date },
    },
    mentorRecommendations: {
      type: [
        new Schema(
          {
            mentorId: { type: String, required: true },
            name: { type: String, required: true },
            headline: { type: String },
            hourlyRate: { type: Number },
            specialties: { type: [String], default: [] },
            matchScore: { type: Number },
            matchReason: { type: String },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

careerProfileSchema.index({ userId: 1 }, { unique: true });

export const CareerProfileModel = mongoose.model<ICareerProfileDocument>('CareerProfile', careerProfileSchema);

export function toCareerProfile(doc: ICareerProfileDocument): CareerProfile {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    status: doc.status,
    resume: doc.resume,
    rawText: doc.rawText,
    extractedProfile: doc.extractedProfile,
    goalProfile: doc.goalProfile,
    latestAnalysis: doc.latestAnalysis,
    mentorRecommendations: doc.mentorRecommendations ?? [],
    errorMessage: doc.errorMessage,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
