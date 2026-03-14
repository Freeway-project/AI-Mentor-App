import mongoose from 'mongoose';
import { logger } from '@owl-mentors/utils';
import { ITranscriptDocument, TranscriptModel } from '../models/transcript.model';

export interface CreateTranscriptData {
  meetingId: string;
  menteeId: string;
  mentorId: string;
  dailyRecordingId: string;
  dailyRoomName: string;
  rawText: string;
  durationSeconds: number;
}

export interface UpdateSummaryData {
  summary: string;
  actionItems: string[];
  keyTopics: string[];
  status: 'summarized' | 'failed';
}

export class TranscriptRepository {
  async create(data: CreateTranscriptData): Promise<ITranscriptDocument> {
    const startTime = Date.now();
    try {
      const doc = await TranscriptModel.create({
        meetingId: new mongoose.Types.ObjectId(data.meetingId),
        menteeId: new mongoose.Types.ObjectId(data.menteeId),
        mentorId: new mongoose.Types.ObjectId(data.mentorId),
        dailyRecordingId: data.dailyRecordingId,
        dailyRoomName: data.dailyRoomName,
        rawText: data.rawText,
        durationSeconds: data.durationSeconds,
        status: 'raw',
      });
      logger.db({ operation: 'insert', collection: 'transcripts', duration: Date.now() - startTime });
      return doc;
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'transcripts', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByMeetingId(meetingId: string): Promise<ITranscriptDocument | null> {
    const startTime = Date.now();
    try {
      const doc = await TranscriptModel.findOne({ meetingId: new mongoose.Types.ObjectId(meetingId) });
      logger.db({ operation: 'findOne', collection: 'transcripts', duration: Date.now() - startTime });
      return doc;
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'transcripts', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async findByDailyRecordingId(dailyRecordingId: string): Promise<ITranscriptDocument | null> {
    const startTime = Date.now();
    try {
      const doc = await TranscriptModel.findOne({ dailyRecordingId });
      logger.db({ operation: 'findOne', collection: 'transcripts', duration: Date.now() - startTime });
      return doc;
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'transcripts', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async updateSummary(id: string, data: UpdateSummaryData): Promise<ITranscriptDocument | null> {
    const startTime = Date.now();
    try {
      const doc = await TranscriptModel.findByIdAndUpdate(
        id,
        {
          $set: {
            summary: data.summary,
            actionItems: data.actionItems,
            keyTopics: data.keyTopics,
            status: data.status,
            summaryGeneratedAt: new Date(),
          },
        },
        { new: true }
      );
      logger.db({ operation: 'update', collection: 'transcripts', duration: Date.now() - startTime });
      return doc;
    } catch (error) {
      logger.db({ operation: 'update', collection: 'transcripts', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
