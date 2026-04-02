import mongoose from 'mongoose';
import {
  CareerAnalysis,
  CareerExtractedProfile,
  CareerGoalProfile,
  CareerMentorRecommendation,
  CareerProfile,
} from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { CareerProfileModel, toCareerProfile } from '../models/career-profile.model';

interface ResumeUpsertInput {
  fileUrl: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  rawText: string;
  extractedProfile: CareerExtractedProfile;
}

export class CareerProfileRepository {
  async findByUserId(userId: string): Promise<CareerProfile | null> {
    const startTime = Date.now();
    try {
      const doc = await CareerProfileModel.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      logger.db({ operation: 'findOne', collection: 'careerprofiles', duration: Date.now() - startTime });
      return doc ? toCareerProfile(doc) : null;
    } catch (error) {
      logger.db({ operation: 'findOne', collection: 'careerprofiles', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async upsertResume(userId: string, data: ResumeUpsertInput): Promise<CareerProfile> {
    const startTime = Date.now();
    try {
      const doc = await CareerProfileModel.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
          $set: {
            userId: new mongoose.Types.ObjectId(userId),
            status: 'ready',
            resume: {
              fileUrl: data.fileUrl,
              fileKey: data.fileKey,
              fileName: data.fileName,
              mimeType: data.mimeType,
              uploadedAt: new Date(),
              textExtractedAt: new Date(),
            },
            rawText: data.rawText,
            extractedProfile: data.extractedProfile,
            errorMessage: undefined,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      logger.db({ operation: 'update', collection: 'careerprofiles', duration: Date.now() - startTime });
      return toCareerProfile(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'careerprofiles', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async updateAnalysis(
    userId: string,
    data: {
      goalProfile: CareerGoalProfile;
      latestAnalysis: CareerAnalysis;
      mentorRecommendations: CareerMentorRecommendation[];
    }
  ): Promise<CareerProfile> {
    const startTime = Date.now();
    try {
      const doc = await CareerProfileModel.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
          $set: {
            goalProfile: data.goalProfile,
            latestAnalysis: data.latestAnalysis,
            mentorRecommendations: data.mentorRecommendations,
            status: 'ready',
            errorMessage: undefined,
          },
        },
        { new: true }
      );
      logger.db({ operation: 'update', collection: 'careerprofiles', duration: Date.now() - startTime });
      if (!doc) throw new Error('Career profile not found');
      return toCareerProfile(doc);
    } catch (error) {
      logger.db({ operation: 'update', collection: 'careerprofiles', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async markFailed(userId: string, errorMessage: string): Promise<void> {
    const startTime = Date.now();
    try {
      await CareerProfileModel.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
          $set: {
            status: 'failed',
            errorMessage,
          },
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
      logger.db({ operation: 'update', collection: 'careerprofiles', duration: Date.now() - startTime });
    } catch (error) {
      logger.db({ operation: 'update', collection: 'careerprofiles', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
