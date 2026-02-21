import mongoose from 'mongoose';
import { CreditAccount, CreditTransaction, ListTransactionsInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { CreditAccountModel, CreditTransactionModel, toCreditAccount, toCreditTransaction } from '../models/credit.model';

export class CreditRepository {
  async getOrCreateAccount(userId: string): Promise<CreditAccount> {
    const startTime = Date.now();
    try {
      const doc = await CreditAccountModel.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $setOnInsert: { userId: new mongoose.Types.ObjectId(userId), balance: 0, heldBalance: 0, totalPurchased: 0, totalSpent: 0 } },
        { upsert: true, new: true }
      );
      logger.db({ operation: 'findOrCreate', collection: 'credit_accounts', duration: Date.now() - startTime });
      return toCreditAccount(doc!);
    } catch (error) {
      logger.db({ operation: 'findOrCreate', collection: 'credit_accounts', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async getBalance(userId: string): Promise<CreditAccount> {
    return this.getOrCreateAccount(userId);
  }

  async purchaseCredits(userId: string, amount: number, description: string): Promise<CreditTransaction> {
    const startTime = Date.now();
    try {
      const account = await CreditAccountModel.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $inc: { balance: amount, totalPurchased: amount } },
        { new: true, upsert: true }
      );

      const tx = await CreditTransactionModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'purchase',
        amount,
        balanceAfter: account!.balance,
        description,
      });
      logger.db({ operation: 'purchase', collection: 'credit_transactions', duration: Date.now() - startTime });
      return toCreditTransaction(tx);
    } catch (error) {
      logger.db({ operation: 'purchase', collection: 'credit_transactions', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async holdCredits(userId: string, amount: number, sessionId: string): Promise<CreditTransaction> {
    const startTime = Date.now();
    try {
      const account = await CreditAccountModel.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (!account || account.balance < amount) throw new Error('Insufficient credits');

      const updated = await CreditAccountModel.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $inc: { balance: -amount, heldBalance: amount } },
        { new: true }
      );

      const tx = await CreditTransactionModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'hold',
        amount,
        balanceAfter: updated!.balance,
        sessionId: new mongoose.Types.ObjectId(sessionId),
        description: `Credits held for session ${sessionId}`,
      });
      logger.db({ operation: 'hold', collection: 'credit_transactions', duration: Date.now() - startTime });
      return toCreditTransaction(tx);
    } catch (error) {
      logger.db({ operation: 'hold', collection: 'credit_transactions', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async deductHeldCredits(userId: string, amount: number, sessionId: string): Promise<CreditTransaction> {
    const startTime = Date.now();
    try {
      const account = await CreditAccountModel.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $inc: { heldBalance: -amount, totalSpent: amount } },
        { new: true }
      );

      const tx = await CreditTransactionModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'deduct',
        amount,
        balanceAfter: account!.balance,
        sessionId: new mongoose.Types.ObjectId(sessionId),
        description: `Credits deducted for completed session ${sessionId}`,
      });
      logger.db({ operation: 'deduct', collection: 'credit_transactions', duration: Date.now() - startTime });
      return toCreditTransaction(tx);
    } catch (error) {
      logger.db({ operation: 'deduct', collection: 'credit_transactions', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async returnHeldCredits(userId: string, amount: number, sessionId: string): Promise<CreditTransaction> {
    const startTime = Date.now();
    try {
      const account = await CreditAccountModel.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $inc: { heldBalance: -amount, balance: amount } },
        { new: true }
      );

      const tx = await CreditTransactionModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'return',
        amount,
        balanceAfter: account!.balance,
        sessionId: new mongoose.Types.ObjectId(sessionId),
        description: `Credits returned for cancelled session ${sessionId}`,
      });
      logger.db({ operation: 'return', collection: 'credit_transactions', duration: Date.now() - startTime });
      return toCreditTransaction(tx);
    } catch (error) {
      logger.db({ operation: 'return', collection: 'credit_transactions', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async listTransactions(filter: Partial<ListTransactionsInput>, limit = 20, offset = 0): Promise<{ transactions: CreditTransaction[]; total: number }> {
    const startTime = Date.now();
    try {
      const query: any = {};
      if (filter.userId) query.userId = new mongoose.Types.ObjectId(filter.userId);
      if (filter.type) query.type = filter.type;

      const [docs, total] = await Promise.all([
        CreditTransactionModel.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit),
        CreditTransactionModel.countDocuments(query),
      ]);
      logger.db({ operation: 'find', collection: 'credit_transactions', duration: Date.now() - startTime });
      return { transactions: docs.map(toCreditTransaction), total };
    } catch (error) {
      logger.db({ operation: 'find', collection: 'credit_transactions', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async getCirculationStats(): Promise<{ totalBalance: number; totalHeld: number; totalSpent: number }> {
    const startTime = Date.now();
    try {
      const result = await CreditAccountModel.aggregate([
        { $group: { _id: null, totalBalance: { $sum: '$balance' }, totalHeld: { $sum: '$heldBalance' }, totalSpent: { $sum: '$totalSpent' } } },
      ]);
      logger.db({ operation: 'aggregate', collection: 'credit_accounts', duration: Date.now() - startTime });
      if (result.length === 0) return { totalBalance: 0, totalHeld: 0, totalSpent: 0 };
      return { totalBalance: result[0].totalBalance, totalHeld: result[0].totalHeld, totalSpent: result[0].totalSpent };
    } catch (error) {
      logger.db({ operation: 'aggregate', collection: 'credit_accounts', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
