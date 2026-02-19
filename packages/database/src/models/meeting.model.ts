import { ObjectId } from 'mongodb';
import { Meeting, MeetingStatus } from '@owl-mentors/types';

export interface MeetingDocument extends Omit<Meeting, 'id' | 'menteeId' | 'mentorId' | 'cancelledBy' | 'createdAt' | 'updatedAt'> {
  _id: ObjectId;
  menteeId: ObjectId;
  mentorId: ObjectId;
  cancelledBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export function toMeeting(doc: MeetingDocument): Meeting {
  return {
    id: doc._id.toString(),
    menteeId: doc.menteeId.toString(),
    mentorId: doc.mentorId.toString(),
    title: doc.title,
    description: doc.description,
    scheduledAt: doc.scheduledAt,
    duration: doc.duration,
    status: doc.status,
    meetingLink: doc.meetingLink,
    notes: doc.notes,
    rating: doc.rating,
    review: doc.review,
    cancelledBy: doc.cancelledBy?.toString(),
    cancelledAt: doc.cancelledAt,
    cancellationReason: doc.cancellationReason,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toMeetingDocument(meeting: Partial<Meeting>): Partial<MeetingDocument> {
  const doc: any = { ...meeting };

  if (meeting.id) {
    doc._id = new ObjectId(meeting.id);
    delete doc.id;
  }

  if (meeting.menteeId) {
    doc.menteeId = new ObjectId(meeting.menteeId);
  }

  if (meeting.mentorId) {
    doc.mentorId = new ObjectId(meeting.mentorId);
  }

  if (meeting.cancelledBy) {
    doc.cancelledBy = new ObjectId(meeting.cancelledBy);
  }

  return doc;
}
