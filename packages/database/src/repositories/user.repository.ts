import { Collection, ObjectId } from 'mongodb';
import { User, RegisterInput, UpdateUserInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { getDatabase } from '../connection';
import { UserDocument, toUser, toUserDocument } from '../models/user.model';

export class UserRepository {
  private collection: Collection<UserDocument>;

  constructor() {
    this.collection = getDatabase().collection<UserDocument>('users');
  }

  async create(data: RegisterInput & { password: string }): Promise<User> {
    const startTime = Date.now();
    try {
      const doc: Partial<UserDocument> = {
        ...data,
        timezone: data.timezone || 'UTC',
        emailVerified: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.collection.insertOne(doc as UserDocument);
      logger.db({ operation: 'insert', collection: 'users', duration: Date.now() - startTime });

      return this.findById(result.insertedId.toString());
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findById(id: string): Promise<User> {
    const startTime = Date.now();
    try {
      const doc = await this.collection.findOne({ _id: new ObjectId(id) });
      logger.db({ operation: 'findOne', collection: 'users', duration: Date.now() - startTime });

      if (!doc) {
        throw new Error('User not found');
      }

      return toUser(doc);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const startTime = Date.now();
    try {
      const doc = await this.collection.findOne({ email });
      logger.db({ operation: 'findOne', collection: 'users', duration: Date.now() - startTime });

      return doc ? toUser(doc) : null;
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const startTime = Date.now();
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });

      if (!result) {
        throw new Error('User not found');
      }

      return toUser(result);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.deleteOne({ _id: new ObjectId(id) });
      logger.db({ operation: 'delete', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'delete', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
