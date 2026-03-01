import mongoose from 'mongoose';
import { UserIntegrationModel, UserIntegration, toUserIntegration } from '../models/user-integration.model';

export class UserIntegrationRepository {
  async upsert(params: {
    userId: string;
    provider: 'google';
    accessToken: string;
    refreshToken: string;
    tokenExpiry: Date;
  }): Promise<UserIntegration> {
    const doc = await UserIntegrationModel.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(params.userId), provider: params.provider },
      {
        $set: {
          accessToken: params.accessToken,
          refreshToken: params.refreshToken,
          tokenExpiry: params.tokenExpiry,
          connectedAt: new Date(),
        },
        $setOnInsert: {
          userId: new mongoose.Types.ObjectId(params.userId),
          provider: params.provider,
        },
      },
      { upsert: true, new: true }
    );
    return toUserIntegration(doc!);
  }

  async findByUser(userId: string, provider: 'google'): Promise<UserIntegration | null> {
    const doc = await UserIntegrationModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      provider,
    });
    return doc ? toUserIntegration(doc) : null;
  }

  async updateTokens(params: {
    userId: string;
    provider: 'google';
    accessToken: string;
    tokenExpiry: Date;
  }): Promise<void> {
    await UserIntegrationModel.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(params.userId), provider: params.provider },
      { $set: { accessToken: params.accessToken, tokenExpiry: params.tokenExpiry } }
    );
  }

  async delete(userId: string, provider: 'google'): Promise<void> {
    await UserIntegrationModel.deleteOne({
      userId: new mongoose.Types.ObjectId(userId),
      provider,
    });
  }
}
