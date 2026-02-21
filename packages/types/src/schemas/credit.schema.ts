import { z } from 'zod';

export const creditTransactionTypeEnum = z.enum([
  'purchase',
  'hold',
  'deduct',
  'refund',
  'return',
]);

export const creditAccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  balance: z.number(),
  heldBalance: z.number(),
  totalPurchased: z.number(),
  totalSpent: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const creditTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: creditTransactionTypeEnum,
  amount: z.number(),
  balanceAfter: z.number(),
  sessionId: z.string().optional(),
  description: z.string(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export const purchaseCreditsSchema = z.object({
  amount: z.number().refine(
    (v) => v === 0.5 || v % 1 === 0,
    { message: 'Amount must be 0.5 or a whole number' }
  ),
});

export const listTransactionsSchema = z.object({
  userId: z.string().optional(),
  type: creditTransactionTypeEnum.optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export type CreditAccount = z.infer<typeof creditAccountSchema>;
export type CreditTransaction = z.infer<typeof creditTransactionSchema>;
export type CreditTransactionType = z.infer<typeof creditTransactionTypeEnum>;
export type PurchaseCreditsInput = z.infer<typeof purchaseCreditsSchema>;
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>;
