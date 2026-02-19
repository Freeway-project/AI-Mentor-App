import { z } from 'zod';

export const offerSchema = z.object({
  id: z.string(),
  mentorId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  durationMinutes: z.number().int().positive(),
  price: z.number().nonnegative(),
  currency: z.string().default('USD'),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Offer = z.infer<typeof offerSchema>;

export const createOfferSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  durationMinutes: z.number().int().positive(),
  price: z.number().nonnegative(),
  currency: z.string().default('USD'),
  isActive: z.boolean().default(true),
});

export const updateOfferSchema = createOfferSchema.partial();

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
