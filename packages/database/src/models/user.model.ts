import { ObjectId } from 'mongodb';
import { User, UserRole } from '@owl-mentors/types';

export interface UserDocument extends Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export function toUser(doc: UserDocument): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    password: doc.password,
    name: doc.name,
    role: doc.role,
    avatar: doc.avatar,
    timezone: doc.timezone,
    emailVerified: doc.emailVerified,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toUserDocument(user: Partial<User>): Partial<UserDocument> {
  const doc: any = { ...user };

  if (user.id) {
    doc._id = new ObjectId(user.id);
    delete doc.id;
  }

  return doc;
}
