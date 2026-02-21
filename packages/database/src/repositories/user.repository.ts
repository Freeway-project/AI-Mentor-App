import { User, UserRole, UpdateUserInput } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { UserModel, IUserDocument, toUser } from '../models/user.model';

export class UserRepository {
  async create(data: {
    email: string;
    password?: string;
    name: string;
    roles: UserRole[];
    timezone?: string;
    phone?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    oauthProviders?: { provider: string; providerId: string }[];
    verifyToken?: string;
  }): Promise<User> {
    const startTime = Date.now();
    try {
      const doc = await UserModel.create({
        email: data.email,
        password: data.password,
        name: data.name,
        roles: data.roles,
        timezone: data.timezone || 'UTC',
        phone: data.phone,
        emailVerified: data.emailVerified || false,
        phoneVerified: data.phoneVerified || false,
        isActive: true,
        oauthProviders: data.oauthProviders,
        verifyToken: data.verifyToken,
      });
      logger.db({ operation: 'insert', collection: 'users', duration: Date.now() - startTime });
      return toUser(doc);
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findById(id: string): Promise<User> {
    const startTime = Date.now();
    try {
      const doc = await UserModel.findById(id).lean<IUserDocument>();
      logger.db({ operation: 'findOne', collection: 'users', duration: Date.now() - startTime });
      if (!doc) throw new Error('User not found');
      return toUser(doc as any);
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const startTime = Date.now();
    try {
      const doc = await UserModel.findOne({ email: email.toLowerCase() });
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
      const doc = await UserModel.findByIdAndUpdate(id, { $set: data }, { new: true });
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
      if (!doc) throw new Error('User not found');
      return toUser(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const startTime = Date.now();
    try {
      await UserModel.findByIdAndDelete(id);
      logger.db({ operation: 'delete', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'delete', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async addRole(userId: string, role: UserRole): Promise<User> {
    const startTime = Date.now();
    try {
      const doc = await UserModel.findByIdAndUpdate(userId, { $addToSet: { roles: role } }, { new: true });
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
      if (!doc) throw new Error('User not found');
      return toUser(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async setResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const startTime = Date.now();
    try {
      await UserModel.findByIdAndUpdate(userId, { $set: { resetToken: token, resetTokenExpiresAt: expiresAt } });
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByResetToken(token: string): Promise<User | null> {
    const startTime = Date.now();
    try {
      const doc = await UserModel.findOne({ resetToken: token, resetTokenExpiresAt: { $gt: new Date() } });
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
      await UserModel.findByIdAndUpdate(userId, {
        $set: { password: hashedPassword },
        $unset: { resetToken: '', resetTokenExpiresAt: '' },
      });
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async setVerifyToken(userId: string, token: string): Promise<void> {
    const startTime = Date.now();
    try {
      await UserModel.findByIdAndUpdate(userId, { $set: { verifyToken: token } });
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByVerifyToken(token: string): Promise<User | null> {
    const startTime = Date.now();
    try {
      const doc = await UserModel.findOne({ verifyToken: token });
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
      await UserModel.findByIdAndUpdate(userId, {
        $set: { emailVerified: true },
        $unset: { verifyToken: '' },
      });
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findAll(filter: { roles?: UserRole; isActive?: boolean; search?: string } = {}, limit = 20, offset = 0): Promise<{ users: User[]; total: number }> {
    const startTime = Date.now();
    try {
      const query: any = {};
      if (filter.roles) query.roles = filter.roles;
      if (filter.isActive !== undefined) query.isActive = filter.isActive;
      if (filter.search) {
        const rx = new RegExp(filter.search, 'i');
        query.$or = [{ name: rx }, { email: rx }];
      }

      const [docs, total] = await Promise.all([
        UserModel.find(query).skip(offset).limit(limit),
        UserModel.countDocuments(query),
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
      await UserModel.findByIdAndUpdate(userId, { $set: { isActive: false } });
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async activate(userId: string): Promise<void> {
    const startTime = Date.now();
    try {
      await UserModel.findByIdAndUpdate(userId, { $set: { isActive: true } });
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async markEmailVerified(userId: string): Promise<void> {
    const startTime = Date.now();
    try {
      await UserModel.findByIdAndUpdate(userId, { $set: { emailVerified: true } });
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async markPhoneVerified(userId: string): Promise<void> {
    const startTime = Date.now();
    try {
      await UserModel.findByIdAndUpdate(userId, { $set: { phoneVerified: true } });
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'users', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
