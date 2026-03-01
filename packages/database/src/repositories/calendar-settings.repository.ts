import mongoose from 'mongoose';
import { CalendarSettingsModel, CalendarSettings, toCalendarSettings } from '../models/calendar-settings.model';

export class CalendarSettingsRepository {
  async upsert(params: {
    userId: string;
    provider: 'google';
    selectedCalendarIds?: string[];
    writeCalendarId?: string;
  }): Promise<CalendarSettings> {
    const setData: any = {};
    if (params.selectedCalendarIds !== undefined) setData.selectedCalendarIds = params.selectedCalendarIds;
    if (params.writeCalendarId !== undefined) setData.writeCalendarId = params.writeCalendarId;

    const doc = await CalendarSettingsModel.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(params.userId), provider: params.provider },
      {
        $set: setData,
        $setOnInsert: {
          userId: new mongoose.Types.ObjectId(params.userId),
          provider: params.provider,
        },
      },
      { upsert: true, new: true }
    );
    return toCalendarSettings(doc!);
  }

  async findByUser(userId: string, provider: 'google'): Promise<CalendarSettings | null> {
    const doc = await CalendarSettingsModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      provider,
    });
    return doc ? toCalendarSettings(doc) : null;
  }

  async delete(userId: string, provider: 'google'): Promise<void> {
    await CalendarSettingsModel.deleteOne({
      userId: new mongoose.Types.ObjectId(userId),
      provider,
    });
  }
}
