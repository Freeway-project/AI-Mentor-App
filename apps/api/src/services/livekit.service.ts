import {
  AccessToken,
  RoomServiceClient,
  WebhookReceiver,
  type WebhookEvent,
} from 'livekit-server-sdk';
import { logger } from '@owl-mentors/utils';
import { serviceUsageService } from './service-usage.service';

function getApiKey(): string {
  const key = process.env.LIVEKIT_API_KEY;
  if (!key) throw new Error('LIVEKIT_API_KEY environment variable is required');
  return key;
}

function getApiSecret(): string {
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!secret) throw new Error('LIVEKIT_API_SECRET environment variable is required');
  return secret;
}

function getHost(): string {
  const url = process.env.LIVEKIT_URL;
  if (!url) throw new Error('LIVEKIT_URL environment variable is required');
  // RoomServiceClient and EgressClient need http(s)://, not ws(s)://
  return url.replace('wss://', 'https://').replace('ws://', 'http://');
}

export class LiveKitService {
  private getRoomClient(): RoomServiceClient {
    return new RoomServiceClient(getHost(), getApiKey(), getApiSecret());
  }

  async createRoom(meetingId: string): Promise<{ roomName: string; roomSid: string }> {
    const startTime = Date.now();
    const roomName = `session-${meetingId}`;
    try {
      const client = this.getRoomClient();
      const room = await client.createRoom({
        name: roomName,
        emptyTimeout: 300,     // auto-close 5 min after last participant leaves
        maxParticipants: 2,
      });
      logger.info(`[LiveKit] Room created: ${roomName} (${room.sid})`);
      await serviceUsageService.recordSuccess({
        service: 'video',
        provider: 'livekit',
        operation: 'create_room',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        metadata: { meetingId, roomName, roomSid: room.sid },
      });
      return { roomName, roomSid: room.sid ?? '' };
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'video',
        provider: 'livekit',
        operation: 'create_room',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
        metadata: { meetingId, roomName },
      });
      throw error;
    }
  }

  createRoomName(meetingId: string): string {
    return `session-${meetingId}`;
  }

  async generateToken(params: {
    roomName: string;
    participantIdentity: string;
    participantName: string;
    isHost?: boolean;
    ttlSeconds?: number;
  }): Promise<string> {
    const at = new AccessToken(getApiKey(), getApiSecret(), {
      identity: params.participantIdentity,
      name: params.participantName,
      ttl: params.ttlSeconds ?? 14400,
    });
    at.addGrant({
      room: params.roomName,
      roomJoin: true,
      roomAdmin: Boolean(params.isHost),
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });
    return at.toJwt();
  }

  async startEgress(roomName: string, meetingId: string): Promise<string | null> {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      logger.info('[LiveKit] AWS_S3_BUCKET not set — skipping egress recording');
      return null;
    }

    const startTime = Date.now();
    try {
      const { EgressClient, EncodedFileOutput, EncodedFileType } = await import('livekit-server-sdk');
      const egressClient = new EgressClient(getHost(), getApiKey(), getApiSecret());

      const s3Config: Record<string, unknown> = {
        accessKey: process.env.AWS_ACCESS_KEY_ID ?? '',
        secret: process.env.AWS_SECRET_ACCESS_KEY ?? '',
        region: process.env.AWS_REGION ?? 'us-east-1',
        bucket,
      };
      if (process.env.AWS_S3_ENDPOINT) {
        s3Config.endpoint = process.env.AWS_S3_ENDPOINT;
      }
      if (process.env.AWS_S3_FORCE_PATH_STYLE === 'true') {
        s3Config.forcePathStyle = true;
      }

      const output = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath: `recordings/${meetingId}/{time}.mp4`,
        output: { case: 's3', value: s3Config as any },
      });

      const egress = await egressClient.startRoomCompositeEgress(roomName, { file: output });
      const egressId = egress.egressId;

      logger.info(`[LiveKit] Egress started: ${egressId} for room ${roomName}`);
      await serviceUsageService.recordSuccess({
        service: 'video',
        provider: 'livekit',
        operation: 'start_egress',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        metadata: { meetingId, roomName, egressId },
      });
      return egressId;
    } catch (error) {
      logger.error(`[LiveKit] Egress start failed for ${roomName}: ${(error as Error).message}`);
      await serviceUsageService.recordFailure({
        service: 'video',
        provider: 'livekit',
        operation: 'start_egress',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
        metadata: { meetingId, roomName },
      });
      return null; // non-fatal — call still works without recording
    }
  }

  async stopEgress(egressId: string): Promise<void> {
    const { EgressClient } = await import('livekit-server-sdk');
    const egressClient = new EgressClient(getHost(), getApiKey(), getApiSecret());
    await egressClient.stopEgress(egressId);
  }

  async verifyWebhook(body: string, authHeader: string | undefined): Promise<WebhookEvent> {
    const receiver = new WebhookReceiver(getApiKey(), getApiSecret());
    return receiver.receive(body, authHeader);
  }

  getServerUrl(): string {
    return process.env.LIVEKIT_URL ?? '';
  }
}
