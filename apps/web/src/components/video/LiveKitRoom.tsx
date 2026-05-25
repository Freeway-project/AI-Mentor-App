'use client';

import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import { LiveKitRoom as LKRoom, VideoConference } from '@livekit/components-react';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Props {
  meetingId: string;
  onLeave: () => void;
}

export function LiveKitRoom({ meetingId, onLeave }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getBookingToken(meetingId).then((data) => {
      setToken(data.token);
      setServerUrl(data.serverUrl);
    }).catch((err: any) => {
      setError(err.message || 'Failed to join session room');
    });
  }, [meetingId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center p-8">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-700 font-medium">{error}</p>
        <button
          onClick={onLeave}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
        <p className="text-slate-600 text-sm">Connecting to session room...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100dvh-4rem)] rounded-2xl overflow-hidden">
      <LKRoom
        token={token}
        serverUrl={serverUrl}
        onDisconnected={onLeave}
        data-lk-theme="default"
        style={{ height: '100%' }}
      >
        <VideoConference />
      </LKRoom>
    </div>
  );
}
