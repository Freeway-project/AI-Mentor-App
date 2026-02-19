import { z } from 'zod';

export const policySchema = z.object({
  id: z.string(),
  mentorId: z.string(),
  cancellationHours: z.number().int().nonnegative().default(24),
  rescheduleHours: z.number().int().nonnegative().default(12),
  noShowPolicy: z.string().max(500).default('No refund for no-shows'),
  customTerms: z.string().max(2000).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Policy = z.infer<typeof policySchema>;

export const upsertPolicySchema = z.object({
  cancellationHours: z.number().int().nonnegative().default(24),
  rescheduleHours: z.number().int().nonnegative().default(12),
  noShowPolicy: z.string().max(500).default('No refund for no-shows'),
  customTerms: z.string().max(2000).optional(),
});

export type UpsertPolicyInput = z.infer<typeof upsertPolicySchema>;
