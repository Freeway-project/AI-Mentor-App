import mongoose, { Schema } from 'mongoose';
import { User } from '@owl-mentors/types';

export interface IUserDocument extends mongoose.Document {
  email: string;
  password?: string;
  name: string;
  roles: string[];
  avatar?: string;
  timezone: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  oauthProviders?: { provider: string; providerId: string }[];
  resetToken?: string;
  resetTokenExpiresAt?: Date;
  verifyToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    name: { type: String, required: true },
    roles: { type: [String], required: true },
    avatar: { type: String },
    timezone: { type: String, default: 'UTC' },
    phone: { type: String },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    oauthProviders: [{ provider: String, providerId: String }],
    resetToken: { type: String, index: { sparse: true } },
    resetTokenExpiresAt: { type: Date },
    verifyToken: { type: String, index: { sparse: true } },
  },
  { timestamps: true }
);

userSchema.index({ roles: 1 });

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);

export function toUser(doc: IUserDocument): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    password: doc.password,
    name: doc.name,
    roles: doc.roles as any,
    avatar: doc.avatar,
    timezone: doc.timezone,
    phone: doc.phone,
    emailVerified: doc.emailVerified,
    phoneVerified: doc.phoneVerified,
    isActive: doc.isActive,
    oauthProviders: doc.oauthProviders,
    resetToken: doc.resetToken,
    resetTokenExpiresAt: doc.resetTokenExpiresAt,
    verifyToken: doc.verifyToken,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
