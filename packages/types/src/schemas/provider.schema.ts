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

export const providerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  bio: z.string().max(1000).optional(),
  specialties: z.array(z.string()),
  expertise: z.array(z.string()),
  languages: z.array(z.string()).default(['English']),
  hourlyRate: z.number().positive().optional(),
  availability: availabilitySchema,
  rating: z.number().min(0).max(5).optional(),
  totalMeetings: z.number().int().nonnegative().default(0),
  totalReviews: z.number().int().nonnegative().default(0),
  verified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Provider = z.infer<typeof providerSchema>;
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;
export type Availability = z.infer<typeof availabilitySchema>;

export const createProviderSchema = providerSchema.omit({
  id: true,
  rating: true,
  totalMeetings: true,
  totalReviews: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProviderSchema = createProviderSchema.partial().omit({
  userId: true,
});

// Search schema
export const searchProvidersSchema = z.object({
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

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type SearchProvidersInput = z.infer<typeof searchProvidersSchema>;
