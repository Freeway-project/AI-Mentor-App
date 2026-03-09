import crypto from 'crypto';
import { logger } from '@owl-mentors/utils';

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
    const apiKey = getApiKey();
    const roomName = `session-${params.meetingId}`;

    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_recording: 'cloud',
          exp: Math.floor(params.expiresAt.getTime() / 1000),
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Daily createRoom failed (${res.status}): ${body}`);
    }

    const data = await res.json() as { name: string; url: string; id: string };
    logger.info(`[Daily] Room created: ${data.name}`);
    return { name: data.name, url: data.url, id: data.id };
  }

  async getRecordingDownloadLink(recordingId: string): Promise<string> {
    const apiKey = getApiKey();

    const res = await fetch(`https://api.daily.co/v1/recordings/${recordingId}/access-link`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Daily getRecordingDownloadLink failed (${res.status}): ${body}`);
    }

    const data = await res.json() as { download_link: string };
    return data.download_link;
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
