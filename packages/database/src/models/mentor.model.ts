import { ObjectId } from 'mongodb';
import { Mentor } from '@owl-mentors/types';

export interface MentorDocument extends Omit<Mentor, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  _id: ObjectId;
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export function toMentor(doc: MentorDocument): Mentor {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    headline: doc.headline,
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
    onboardingStep: doc.onboardingStep,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toMentorDocument(mentor: Partial<Mentor>): Partial<MentorDocument> {
  const doc: any = { ...mentor };

  if (mentor.id) {
    doc._id = new ObjectId(mentor.id);
    delete doc.id;
  }

  if (mentor.userId) {
    doc.userId = new ObjectId(mentor.userId);
  }

  return doc;
}
