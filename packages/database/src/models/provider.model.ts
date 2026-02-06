import { ObjectId } from 'mongodb';
import { Provider } from '@mentor-app/types';

export interface ProviderDocument extends Omit<Provider, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  _id: ObjectId;
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export function toProvider(doc: ProviderDocument): Provider {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    bio: doc.bio,
    specialties: doc.specialties,
    expertise: doc.expertise,
    languages: doc.languages,
    hourlyRate: doc.hourlyRate,
    availability: doc.availability,
    rating: doc.rating,
    totalMeetings: doc.totalMeetings,
    totalReviews: doc.totalReviews,
    verified: doc.verified,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toProviderDocument(provider: Partial<Provider>): Partial<ProviderDocument> {
  const doc: any = { ...provider };

  if (provider.id) {
    doc._id = new ObjectId(provider.id);
    delete doc.id;
  }

  if (provider.userId) {
    doc.userId = new ObjectId(provider.userId);
  }

  return doc;
}
