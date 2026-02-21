import mongoose, { Schema } from 'mongoose';
import { CreditAccount, CreditTransaction } from '@owl-mentors/types';

export interface ICreditAccountDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  heldBalance: number;
  totalPurchased: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreditTransactionDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: 'purchase' | 'hold' | 'deduct' | 'refund' | 'return';
  amount: number;
  balanceAfter: number;
  sessionId?: mongoose.Types.ObjectId;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const creditAccountSchema = new Schema<ICreditAccountDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0 },
    heldBalance: { type: Number, default: 0 },
    totalPurchased: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const creditTransactionSchema = new Schema<ICreditTransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['purchase', 'hold', 'deduct', 'refund', 'return'], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Meeting' },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

creditTransactionSchema.index({ userId: 1 });
creditTransactionSchema.index({ sessionId: 1 }, { sparse: true });
creditTransactionSchema.index({ type: 1 });
creditTransactionSchema.index({ createdAt: -1 });
creditTransactionSchema.index({ userId: 1, createdAt: -1 });

export const CreditAccountModel = mongoose.model<ICreditAccountDocument>('CreditAccount', creditAccountSchema, 'credit_accounts');
export const CreditTransactionModel = mongoose.model<ICreditTransactionDocument>('CreditTransaction', creditTransactionSchema, 'credit_transactions');

export function toCreditAccount(doc: ICreditAccountDocument): CreditAccount {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    balance: doc.balance,
    heldBalance: doc.heldBalance,
    totalPurchased: doc.totalPurchased,
    totalSpent: doc.totalSpent,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toCreditTransaction(doc: ICreditTransactionDocument): CreditTransaction {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    amount: doc.amount,
    balanceAfter: doc.balanceAfter,
    sessionId: doc.sessionId?.toString(),
    description: doc.description,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
  };
}

// Legacy compat
export type CreditAccountDocument = ICreditAccountDocument;
export type CreditTransactionDocument = ICreditTransactionDocument;
