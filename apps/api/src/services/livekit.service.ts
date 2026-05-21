import { AccessToken, EgressClient, RoomServiceClient, WebhookReceiver } from 'livekit-server-sdk';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is required`);
  return value;
}

export class LiveKitService {
  private readonly apiKey = requireEnv('LIVEKIT_API_KEY');
  private readonly apiSecret = requireEnv('LIVEKIT_API_SECRET');
  private readonly serverUrl = requireEnv('LIVEKIT_URL');

  createRoomName(meetingId: string): string {
    return `session-${meetingId}`;
  }

  getServerUrl(): string {
    return this.serverUrl;
  }

  async generateToken(params: {
    roomName: string;
    participantIdentity: string;
    participantName: string;
    isHost?: boolean;
    ttlSeconds?: number;
  }): Promise<string> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: params.participantIdentity,
      name: params.participantName,
      ttl: `${params.ttlSeconds ?? 4 * 60 * 60}s`,
    });

    token.addGrant({
      room: params.roomName,
      roomJoin: true,
      roomAdmin: Boolean(params.isHost),
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    return token.toJwt();
  }

  async createRoom(roomName: string): Promise<void> {
    const client = new RoomServiceClient(this.serverUrl, this.apiKey, this.apiSecret);
    await client.createRoom({ name: roomName });
  }

  async startRoomEgress(params: { roomName: string; meetingId: string }): Promise<{ egressId: string }> {
    const egress = new EgressClient(this.serverUrl, this.apiKey, this.apiSecret);

    const bucket = requireEnv('LIVEKIT_EGRESS_S3_BUCKET');
    const accessKey = requireEnv('LIVEKIT_EGRESS_S3_ACCESS_KEY');
    const secret = requireEnv('LIVEKIT_EGRESS_S3_SECRET');
    const endpoint = requireEnv('LIVEKIT_EGRESS_S3_ENDPOINT');
    const region = process.env.LIVEKIT_EGRESS_S3_REGION || 'auto';
    const forcePathStyle = (process.env.LIVEKIT_EGRESS_S3_FORCE_PATH_STYLE || 'true') === 'true';

    const filepath = `recordings/${params.meetingId}/${Date.now()}-room.mp4`;
    const audioOnlyFilepath = `recordings/${params.meetingId}/${Date.now()}-audio.mp4`;

    const req: any = {
      roomName: params.roomName,
      file: {
        filepath,
        output: {
          case: 's3',
          value: {
            bucket,
            accessKey,
            secret,
            endpoint,
            region,
            forcePathStyle,
          },
        },
      },
      audioOnlyFile: {
        filepath: audioOnlyFilepath,
        output: {
          case: 's3',
          value: {
            bucket,
            accessKey,
            secret,
            endpoint,
            region,
            forcePathStyle,
          },
        },
      },
    };

    const info: any = await (egress as any).startRoomCompositeEgress(req);
    return { egressId: info?.egressId || info?.egress_id };
  }

  async stopEgress(egressId: string): Promise<void> {
    const egress = new EgressClient(this.serverUrl, this.apiKey, this.apiSecret);
    await (egress as any).stopEgress(egressId);
  }

  verifyAndDecodeWebhook(rawBody: string, authHeader?: string): any {
    const receiver = new WebhookReceiver(this.apiKey, this.apiSecret);
    return receiver.receive(rawBody, authHeader || '');
  }
}
