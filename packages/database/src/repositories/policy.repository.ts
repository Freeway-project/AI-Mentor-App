import mongoose from 'mongoose';
import { Policy, UpsertPolicyInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { PolicyModel, toPolicy } from '../models/policy.model';

export class PolicyRepository {
  async upsert(mentorId: string, data: UpsertPolicyInput): Promise<Policy> {
    const startTime = Date.now();
    try {
      const doc = await PolicyModel.findOneAndUpdate(
        { mentorId: new mongoose.Types.ObjectId(mentorId) },
        {
          $set: data,
          $setOnInsert: { mentorId: new mongoose.Types.ObjectId(mentorId) },
        },
        { upsert: true, new: true }
      );
      logger.db({ operation: 'upsert', collection: 'policies', duration: Date.now() - startTime });
      if (!doc) throw new Error('Failed to upsert policy');
      return toPolicy(doc);
    } catch (error) {
      logger.db({ operation: 'upsert', collection: 'policies', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByMentorId(mentorId: string): Promise<Policy | null> {
    const startTime = Date.now();
    try {
      const doc = await PolicyModel.findOne({ mentorId: new mongoose.Types.ObjectId(mentorId) });
      logger.db({ operation: 'findOne', collection: 'policies', duration: Date.now() - startTime });
      return doc ? toPolicy(doc) : null;
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'policies', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
