import mongoose, { Schema } from 'mongoose';

export interface IUserIntegrationDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  provider: 'google';
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  connectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userIntegrationSchema = new Schema<IUserIntegrationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['google'], required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    tokenExpiry: { type: Date, required: true },
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userIntegrationSchema.index({ userId: 1, provider: 1 }, { unique: true });

export const UserIntegrationModel = mongoose.model<IUserIntegrationDocument>(
  'UserIntegration',
  userIntegrationSchema
);

export interface UserIntegration {
  id: string;
  userId: string;
  provider: 'google';
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  connectedAt: Date;
}

export function toUserIntegration(doc: IUserIntegrationDocument): UserIntegration {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    provider: doc.provider,
    accessToken: doc.accessToken,
    refreshToken: doc.refreshToken,
    tokenExpiry: doc.tokenExpiry,
    connectedAt: doc.connectedAt,
  };
}
