import { Collection, ObjectId } from 'mongodb';
import { Policy, UpsertPolicyInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { getDatabase } from '../connection';
import { PolicyDocument, toPolicy } from '../models/policy.model';

export class PolicyRepository {
  private collection: Collection<PolicyDocument>;

  constructor() {
    this.collection = getDatabase().collection<PolicyDocument>('policies');
  }

  async upsert(mentorId: string, data: UpsertPolicyInput): Promise<Policy> {
    const startTime = Date.now();
    try {
      const result = await this.collection.findOneAndUpdate(
        { mentorId: new ObjectId(mentorId) },
        {
          $set: {
            ...data,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            mentorId: new ObjectId(mentorId),
            createdAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      logger.db({ operation: 'upsert', collection: 'policies', duration: Date.now() - startTime });

      if (!result) {
        throw new Error('Failed to upsert policy');
      }

      return toPolicy(result);
    } catch (error) {
      logger.db({ operation: 'upsert', collection: 'policies', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByMentorId(mentorId: string): Promise<Policy | null> {
    const startTime = Date.now();
    try {
      const doc = await this.collection.findOne({ mentorId: new ObjectId(mentorId) });
      logger.db({ operation: 'findOne', collection: 'policies', duration: Date.now() - startTime });

      return doc ? toPolicy(doc) : null;
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'policies', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
