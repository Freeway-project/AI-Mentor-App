'use client';

import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface SessionRoomProps {
  meetingId: string;
  onLeave: () => void;
}

function DisconnectHandler({ onLeave }: { onLeave: () => void }) {
  const room = useRoomContext();
  useEffect(() => {
    const handler = () => onLeave();
    room.on('disconnected', handler);
    return () => { room.off('disconnected', handler); };
  }, [room, onLeave]);
  return null;
}

export function SessionRoom({ meetingId, onLeave }: SessionRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getSessionToken(meetingId)
      .then(({ token: t, serverUrl: url }) => {
        setToken(t);
        setServerUrl(url);
      })
      .catch((err: any) => setError(err.message || 'Could not get session token'))
      .finally(() => setLoading(false));
  }, [meetingId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
        <p className="ml-3 text-slate-400">Connecting to session...</p>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-bold text-white">Could not join session</h2>
        <p className="mb-6 text-slate-400">{error ?? 'No token received'}</p>
        <button
          onClick={onLeave}
          className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Return to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect
        video
        audio
        onDisconnected={onLeave}
        style={{ height: '100%' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
        <DisconnectHandler onLeave={onLeave} />
      </LiveKitRoom>
    </div>
  );
}
