import crypto from 'crypto';
import { logger } from '@owl-mentors/utils';
import { serviceUsageService } from './service-usage.service';

export interface DailyRoom {
  name: string;
  url: string;
  id: string;
}

function getApiKey(): string {
  const key = process.env.DAILY_API_KEY;
  if (!key) throw new Error('DAILY_API_KEY environment variable is required');
  return key;
}

export class DailyService {
  async createRoom(params: { meetingId: string; expiresAt: Date }): Promise<DailyRoom> {
    const startTime = Date.now();
    const roomName = `session-${params.meetingId}`;

    try {
      const apiKey = getApiKey();
      const res = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName,
          properties: {
            exp: Math.floor(params.expiresAt.getTime() / 1000),
            enable_chat: true,
            enable_screenshare: true,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Daily createRoom failed (${res.status}): ${body}`);
      }

      const data = await res.json() as { name: string; url: string; id: string };
      logger.info(`[Daily] Room created: ${data.name}`);
      await serviceUsageService.recordSuccess({
        service: 'video',
        provider: 'daily',
        operation: 'create_room',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        metadata: {
          meetingId: params.meetingId,
          roomName: data.name,
        },
      });
      return { name: data.name, url: data.url, id: data.id };
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'video',
        provider: 'daily',
        operation: 'create_room',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
        metadata: {
          meetingId: params.meetingId,
          roomName,
        },
      });
      throw error;
    }
  }

  async getRecordingDownloadLink(recordingId: string): Promise<string> {
    const startTime = Date.now();
    try {
      const apiKey = getApiKey();
      const res = await fetch(`https://api.daily.co/v1/recordings/${recordingId}/access-link`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Daily getRecordingDownloadLink failed (${res.status}): ${body}`);
      }

      const data = await res.json() as { download_link: string };
      await serviceUsageService.recordSuccess({
        service: 'video',
        provider: 'daily',
        operation: 'get_recording_download_link',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        metadata: { recordingId },
      });
      return data.download_link;
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'video',
        provider: 'daily',
        operation: 'get_recording_download_link',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
        metadata: { recordingId },
      });
      throw error;
    }
  }

  verifyWebhookSignature(rawBody: string, header: string): boolean {
    const secret = process.env.DAILY_WEBHOOK_SECRET;
    if (!secret) {
      logger.warn('[Daily] DAILY_WEBHOOK_SECRET not set — skipping signature verification');
      return false;
    }

    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const headerBuf = Buffer.from(header, 'utf8');

    if (expectedBuf.length !== headerBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, headerBuf);
  }
}
