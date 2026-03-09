import mongoose, { Schema } from 'mongoose';

export interface ITranscriptDocument extends mongoose.Document {
  meetingId: mongoose.Types.ObjectId;
  menteeId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  dailyRecordingId: string;
  dailyRoomName: string;
  rawText: string;
  summary?: string;
  actionItems: string[];
  keyTopics: string[];
  summaryGeneratedAt?: Date;
  durationSeconds: number;
  status: 'raw' | 'summarized' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const transcriptSchema = new Schema<ITranscriptDocument>(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
    menteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true },
    dailyRecordingId: { type: String, required: true },
    dailyRoomName: { type: String, required: true },
    rawText: { type: String, required: true },
    summary: { type: String },
    actionItems: { type: [String], default: [] },
    keyTopics: { type: [String], default: [] },
    summaryGeneratedAt: { type: Date },
    durationSeconds: { type: Number, required: true },
    status: {
      type: String,
      enum: ['raw', 'summarized', 'failed'],
      default: 'raw',
    },
  },
  { timestamps: true }
);

transcriptSchema.index({ meetingId: 1 }, { unique: true });
transcriptSchema.index({ dailyRecordingId: 1 }, { unique: true });
transcriptSchema.index({ menteeId: 1 });
transcriptSchema.index({ mentorId: 1 });

export const TranscriptModel = mongoose.model<ITranscriptDocument>('Transcript', transcriptSchema);
