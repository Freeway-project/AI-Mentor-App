'use client';

import '@livekit/components-styles';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';

interface SessionRoomProps {
  token: string;
  serverUrl: string;
  onLeave?: () => void;
}

export function SessionRoom({ token, serverUrl, onLeave }: SessionRoomProps) {
  return (
    <div className="h-[calc(100vh-3rem)] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect
        video
        audio
        onDisconnected={onLeave}
        className="h-full w-full"
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
