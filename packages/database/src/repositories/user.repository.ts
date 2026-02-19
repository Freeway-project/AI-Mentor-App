import { Collection, ObjectId } from 'mongodb';
import { User, UserRole, RegisterInput, UpdateUserInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { getDatabase } from '../connection';
import { UserDocument, toUser } from '../models/user.model';

export class UserRepository {
  private collection: Collection<UserDocument>;

  constructor() {
    this.collection = getDatabase().collection<UserDocument>('users');
  }

  async create(data: {
    email: string;
    password?: string;
    name: string;
    roles: UserRole[];
    timezone?: string;
    emailVerified?: boolean;
    oauthProviders?: { provider: string; providerId: string }[];
    verifyToken?: string;
  }): Promise<User> {
    const startTime = Date.now();
    try {
      const doc: Partial<UserDocument> = {
        email: data.email,
        password: data.password,
        name: data.name,
        roles: data.roles,
        timezone: data.timezone || 'UTC',
        emailVerified: data.emailVerified || false,
        isActive: true,
        oauthProviders: data.oauthProviders,
        verifyToken: data.verifyToken,
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

  async addRole(userId: string, role: UserRole): Promise<User> {
    const startTime = Date.now();
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $addToSet: { roles: role }, $set: { updatedAt: new Date() } },
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

  async setResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { resetToken: token, resetTokenExpiresAt: expiresAt, updatedAt: new Date() } }
      );
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByResetToken(token: string): Promise<User | null> {
    const startTime = Date.now();
    try {
      const doc = await this.collection.findOne({
        resetToken: token,
        resetTokenExpiresAt: { $gt: new Date() },
      });
      logger.db({ operation: 'findOne', collection: 'users', duration: Date.now() - startTime });

      return doc ? toUser(doc) : null;
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async resetPassword(userId: string, hashedPassword: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: { password: hashedPassword, updatedAt: new Date() },
          $unset: { resetToken: '', resetTokenExpiresAt: '' },
        }
      );
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async setVerifyToken(userId: string, token: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { verifyToken: token, updatedAt: new Date() } }
      );
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByVerifyToken(token: string): Promise<User | null> {
    const startTime = Date.now();
    try {
      const doc = await this.collection.findOne({ verifyToken: token });
      logger.db({ operation: 'findOne', collection: 'users', duration: Date.now() - startTime });

      return doc ? toUser(doc) : null;
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async verifyEmail(userId: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: { emailVerified: true, updatedAt: new Date() },
          $unset: { verifyToken: '' },
        }
      );
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findAll(filter: { roles?: UserRole; isActive?: boolean } = {}, limit = 20, offset = 0): Promise<{ users: User[]; total: number }> {
    const startTime = Date.now();
    try {
      const query: any = {};
      if (filter.roles) query.roles = filter.roles;
      if (filter.isActive !== undefined) query.isActive = filter.isActive;

      const [docs, total] = await Promise.all([
        this.collection.find(query).skip(offset).limit(limit).toArray(),
        this.collection.countDocuments(query),
      ]);

      logger.db({ operation: 'find', collection: 'users', duration: Date.now() - startTime });

      return { users: docs.map(toUser), total };
    } catch (error) {
      logger.db({ operation: 'find', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async suspend(userId: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isActive: false, updatedAt: new Date() } }
      );
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async activate(userId: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isActive: true, updatedAt: new Date() } }
      );
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
