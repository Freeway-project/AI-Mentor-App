import jwt from 'jsonwebtoken';

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

export class LiveKitService {
  createRoomName(meetingId: string): string {
    return `session-${meetingId}`;
  }

  generateToken(params: {
    roomName: string;
    participantIdentity: string;
    participantName: string;
    isHost?: boolean;
    ttlSeconds?: number;
  }): string {
    const now = Math.floor(Date.now() / 1000);
    const ttl = params.ttlSeconds ?? 4 * 60 * 60;
    const payload = {
      iss: getApiKey(),
      sub: params.participantIdentity,
      nbf: now,
      exp: now + ttl,
      name: params.participantName,
      video: {
        room: params.roomName,
        roomJoin: true,
        roomAdmin: Boolean(params.isHost),
        canPublish: true,
        canPublishData: true,
        canSubscribe: true,
      },
    };

    return jwt.sign(payload, getApiSecret(), { algorithm: 'HS256' });
  }

  getServerUrl(): string {
    const url = process.env.LIVEKIT_URL;
    if (!url) throw new Error('LIVEKIT_URL environment variable is required');
    return url;
  }
}
