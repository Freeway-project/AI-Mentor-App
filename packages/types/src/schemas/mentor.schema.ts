import { z } from 'zod';

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:mm format
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
});

export const availabilitySchema = z.object({
  timezone: z.string(),
  schedule: z.array(availabilitySlotSchema),
});

export const onboardingStepEnum = z.enum([
  'profile',
  'offers',
  'policies',
  'availability',
  'review',
  'published',
]);

export const approvalStatusEnum = z.enum(['pending', 'approved', 'rejected']);

export const mentorSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  headline: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  specialties: z.array(z.string()),
  expertise: z.array(z.string()),
  topicIds: z.array(z.string()).default([]),
  languages: z.array(z.string()).default(['English']),
  hourlyRate: z.number().positive().optional(),
  availability: availabilitySchema.optional(),
  rating: z.number().min(0).max(5).optional(),
  totalMeetings: z.number().int().nonnegative().default(0),
  totalReviews: z.number().int().nonnegative().default(0),
  verified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  onboardingStep: onboardingStepEnum.default('profile'),
  approvalStatus: approvalStatusEnum.default('pending'),
  approvalNote: z.string().optional(),
  approvedAt: z.date().optional(),
  approvedBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Mentor = z.infer<typeof mentorSchema>;
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;
export type Availability = z.infer<typeof availabilitySchema>;
export type OnboardingStep = z.infer<typeof onboardingStepEnum>;
export type ApprovalStatus = z.infer<typeof approvalStatusEnum>;

export const createMentorSchema = mentorSchema.omit({
  id: true,
  rating: true,
  totalMeetings: true,
  totalReviews: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMentorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  headline: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  specialties: z.array(z.string()).optional(),
  expertise: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  hourlyRate: z.number().positive().optional(),
});

export const updateAvailabilitySchema = availabilitySchema;

// Search schema
export const searchMentorsSchema = z.object({
  query: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxRate: z.number().positive().optional(),
  availability: z.object({
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  }).optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export type CreateMentorInput = z.infer<typeof createMentorSchema>;
export type UpdateMentorInput = z.infer<typeof updateMentorSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type SearchMentorsInput = z.infer<typeof searchMentorsSchema>;
