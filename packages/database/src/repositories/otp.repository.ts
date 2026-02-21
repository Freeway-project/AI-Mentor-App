import mongoose from 'mongoose';
import { OtpType } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { OtpModel, IOtpDocument, toOtp } from '../models/otp.model';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class OtpRepository {
  async createOtp(userId: string, type: OtpType, target: string, ttlMinutes = 10): Promise<string> {
    const startTime = Date.now();
    try {
      // Invalidate any existing OTP for this user+type
      await OtpModel.deleteMany({ userId: new mongoose.Types.ObjectId(userId), type });

      const code = generateCode();
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      await OtpModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        type,
        target,
        code,
        expiresAt,
        verified: false,
      });

      logger.db({ operation: 'insert', collection: 'otps', duration: Date.now() - startTime });
      return code;
    } catch (error) {
      logger.db({ operation: 'insert', collection: 'otps', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async verifyOtp(userId: string, type: OtpType, code: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      const otp = await OtpModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        type,
        code,
        verified: false,
        expiresAt: { $gt: new Date() },
      });

      logger.db({ operation: 'findOne', collection: 'otps', duration: Date.now() - startTime });

      if (!otp) return false;

      await OtpModel.findByIdAndUpdate(otp._id, { $set: { verified: true } });
      return true;
    } catch (error) {
      logger.db({ operation: 'verify', collection: 'otps', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }

  async getVerificationStatus(userId: string): Promise<{ emailVerified: boolean; phoneVerified: boolean }> {
    const startTime = Date.now();
    try {
      const otps = await OtpModel.find({
        userId: new mongoose.Types.ObjectId(userId),
        verified: true,
      });
      logger.db({ operation: 'find', collection: 'otps', duration: Date.now() - startTime });
      return {
        emailVerified: otps.some((o) => o.type === 'email'),
        phoneVerified: otps.some((o) => o.type === 'phone'),
      };
    } catch (error) {
      logger.db({ operation: 'find', collection: 'otps', duration: Date.now() - startTime, error: (error as Error).message });
      throw error;
    }
  }
}
