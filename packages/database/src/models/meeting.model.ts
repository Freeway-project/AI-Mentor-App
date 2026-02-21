import mongoose, { Schema } from 'mongoose';
import { Meeting } from '@owl-mentors/types';

export interface IMeetingDocument extends mongoose.Document {
  menteeId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  status: string;
  creditCost: number;
  offerId?: string;
  meetingLink?: string;
  notes?: string;
  rating?: number;
  review?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;
  rescheduledFrom?: string;
  rescheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeetingDocument>(
  {
    menteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true },
    title: { type: String, required: true },
    description: { type: String },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'booked', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show', 'refunded'],
      default: 'booked',
    },
    creditCost: { type: Number, required: true, default: 1.0 },
    offerId: { type: String },
    meetingLink: { type: String },
    notes: { type: String },
    rating: { type: Number },
    review: { type: String },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    rescheduledFrom: { type: String },
    rescheduledAt: { type: Date },
  },
  { timestamps: true }
);

meetingSchema.index({ menteeId: 1 });
meetingSchema.index({ mentorId: 1 });
meetingSchema.index({ scheduledAt: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ menteeId: 1, status: 1 });
meetingSchema.index({ mentorId: 1, status: 1 });

export const MeetingModel = mongoose.model<IMeetingDocument>('Meeting', meetingSchema);

export function toMeeting(doc: IMeetingDocument): Meeting {
  return {
    id: doc._id.toString(),
    menteeId: doc.menteeId.toString(),
    mentorId: doc.mentorId.toString(),
    title: doc.title,
    description: doc.description,
    scheduledAt: doc.scheduledAt,
    duration: doc.duration,
    status: doc.status as any,
    creditCost: doc.creditCost,
    offerId: doc.offerId,
    meetingLink: doc.meetingLink,
    notes: doc.notes,
    rating: doc.rating,
    review: doc.review,
    cancelledBy: doc.cancelledBy?.toString(),
    cancelledAt: doc.cancelledAt,
    cancellationReason: doc.cancellationReason,
    rescheduledFrom: doc.rescheduledFrom,
    rescheduledAt: doc.rescheduledAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Legacy compat
export type MeetingDocument = IMeetingDocument;
export function toMeetingDocument(meeting: any) { return meeting; }
