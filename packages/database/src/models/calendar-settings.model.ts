import mongoose, { Schema } from 'mongoose';

export interface ICalendarSettingsDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  provider: 'google';
  selectedCalendarIds: string[];
  writeCalendarId: string;
  createdAt: Date;
  updatedAt: Date;
}

const calendarSettingsSchema = new Schema<ICalendarSettingsDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['google'], required: true },
    selectedCalendarIds: { type: [String], default: [] },
    writeCalendarId: { type: String, default: 'primary' },
  },
  { timestamps: true }
);

calendarSettingsSchema.index({ userId: 1, provider: 1 }, { unique: true });

export const CalendarSettingsModel = mongoose.model<ICalendarSettingsDocument>(
  'CalendarSettings',
  calendarSettingsSchema
);

export interface CalendarSettings {
  id: string;
  userId: string;
  provider: 'google';
  selectedCalendarIds: string[];
  writeCalendarId: string;
}

export function toCalendarSettings(doc: ICalendarSettingsDocument): CalendarSettings {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    provider: doc.provider,
    selectedCalendarIds: doc.selectedCalendarIds,
    writeCalendarId: doc.writeCalendarId,
  };
}
