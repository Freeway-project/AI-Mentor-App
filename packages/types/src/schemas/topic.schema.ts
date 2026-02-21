import { z } from 'zod';

export const topicSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  mentorCount: z.number().int().nonnegative().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createTopicSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateTopicSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export type Topic = z.infer<typeof topicSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
