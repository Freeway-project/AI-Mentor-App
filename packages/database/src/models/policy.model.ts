import { ObjectId } from 'mongodb';
import { Policy } from '@owl-mentors/types';

export interface PolicyDocument extends Omit<Policy, 'id' | 'mentorId' | 'createdAt' | 'updatedAt'> {
  _id: ObjectId;
  mentorId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export function toPolicy(doc: PolicyDocument): Policy {
  return {
    id: doc._id.toString(),
    mentorId: doc.mentorId.toString(),
    cancellationHours: doc.cancellationHours,
    rescheduleHours: doc.rescheduleHours,
    noShowPolicy: doc.noShowPolicy,
    customTerms: doc.customTerms,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
