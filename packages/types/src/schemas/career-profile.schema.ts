import { z } from 'zod';

export const careerTimelineEntrySchema = z.object({
  title: z.string(),
  company: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  summary: z.string().optional(),
  capabilitiesUsed: z.array(z.string()).default([]),
});

export const careerProjectSchema = z.object({
  name: z.string(),
  summary: z.string().optional(),
  capabilitiesUsed: z.array(z.string()).default([]),
});

export const careerEducationSchema = z.object({
  institution: z.string(),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  graduationYear: z.string().optional(),
});

export const careerResumeSchema = z.object({
  fileUrl: z.string().optional(),
  fileKey: z.string().optional(),
  fileName: z.string(),
  mimeType: z.string(),
  uploadedAt: z.date(),
  textExtractedAt: z.date().optional(),
});

export const careerExtractedProfileSchema = z.object({
  summary: z.string(),
  headline: z.string().optional(),
  coreCapabilities: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  domains: z.array(z.string()).default([]),
  functionalSkills: z.array(z.string()).default([]),
  communicationSkills: z.array(z.string()).default([]),
  leadershipSignals: z.array(z.string()).default([]),
  careerInterests: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  projects: z.array(careerProjectSchema).default([]),
  education: z.array(careerEducationSchema).default([]),
  experienceTimeline: z.array(careerTimelineEntrySchema).default([]),
  seniorityEstimate: z.string(),
  strengthSignals: z.array(z.string()).default([]),
  weakSignals: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});

export const careerGoalInputSchema = z.object({
  targetRole: z.string().max(120).optional(),
  careerStageGoal: z.string().max(120).optional(),
  timelineMonths: z.number().int().min(1).max(36).optional(),
  focusAreas: z.array(z.string()).max(10).optional(),
  weeklyHours: z.number().int().min(1).max(80).optional(),
  maxBudget: z.number().positive().max(10000).optional(),
  preferredLanguage: z.string().max(60).optional(),
  freeformGoal: z.string().max(1200).optional(),
});

export const careerGoalProfileSchema = z.object({
  targetRole: z.string(),
  goalType: z.string(),
  timelineMonths: z.number().int().positive().optional(),
  priorityAreas: z.array(z.string()).default([]),
  inferredCurrentLevel: z.string().optional(),
  constraints: z.object({
    weeklyHours: z.number().int().positive().optional(),
    maxBudget: z.number().positive().optional(),
    preferredLanguage: z.string().optional(),
  }).default({}),
  confidence: z.number().min(0).max(1).default(0.5),
  goalSummary: z.string(),
});

export const careerAnalysisSchema = z.object({
  currentLevelSummary: z.string(),
  topStrengths: z.array(z.string()).default([]),
  primaryGaps: z.array(z.string()).default([]),
  recommendedFocusAreas: z.array(z.string()).default([]),
  recommendedLearningOrder: z.array(z.string()).default([]),
  explorationSuggestions: z.array(z.string()).default([]),
  briefPlan: z.string(),
  mentorSearchQuery: z.string(),
  generatedAt: z.date(),
});

export const careerMentorRecommendationSchema = z.object({
  mentorId: z.string(),
  name: z.string(),
  headline: z.string().optional(),
  hourlyRate: z.number().positive().optional(),
  specialties: z.array(z.string()).default([]),
  matchScore: z.number().min(0).max(1).optional(),
  matchReason: z.string().optional(),
});

export const careerProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.enum(['idle', 'ready', 'failed']).default('idle'),
  resume: careerResumeSchema.optional(),
  rawText: z.string().optional(),
  extractedProfile: careerExtractedProfileSchema.optional(),
  goalProfile: careerGoalProfileSchema.optional(),
  latestAnalysis: careerAnalysisSchema.optional(),
  mentorRecommendations: z.array(careerMentorRecommendationSchema).default([]),
  errorMessage: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CareerTimelineEntry = z.infer<typeof careerTimelineEntrySchema>;
export type CareerProject = z.infer<typeof careerProjectSchema>;
export type CareerEducation = z.infer<typeof careerEducationSchema>;
export type CareerResume = z.infer<typeof careerResumeSchema>;
export type CareerExtractedProfile = z.infer<typeof careerExtractedProfileSchema>;
export type CareerGoalInput = z.infer<typeof careerGoalInputSchema>;
export type CareerGoalProfile = z.infer<typeof careerGoalProfileSchema>;
export type CareerAnalysis = z.infer<typeof careerAnalysisSchema>;
export type CareerMentorRecommendation = z.infer<typeof careerMentorRecommendationSchema>;
export type CareerProfile = z.infer<typeof careerProfileSchema>;
