'use client';

import { useEffect, useRef, useState } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { Camera, Mic, PhoneOff, Settings, AlertCircle, Share } from 'lucide-react';

interface DailyVideoCallProps {
  url: string;
  onLeave: () => void;
}

export function DailyVideoCall({ url, onLeave }: DailyVideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || callObject) return;

    // Create a new Daily call frame embedded in the div
    const callFrame = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '12px',
        backgroundColor: '#0f172a', // slate-900 equivalent for dark theme
      },
      theme: {
        colors: {
          accent: '#8b5cf6', // violet-500
          accentText: '#ffffff',
          background: '#0f172a',
          backgroundAccent: '#1e293b', // slate-800
          baseText: '#f8fafc',
          border: '#334155', // slate-700
          mainAreaBg: '#0f172a',
          mainAreaBgAccent: '#1e293b',
          mainAreaText: '#f8fafc',
          supportiveText: '#94a3b8', // slate-400
        },
      },
    });

    setCallObject(callFrame);

    const handleJoinedMeeting = () => {
      console.log('Joined Daily meeting successfully');
    };

    const handleLeftMeeting = () => {
      callFrame.destroy();
      setCallObject(null);
      onLeave();
    };

    const handleError = (e: any) => {
      console.error('Daily call error:', e);
      setError(e?.errorMsg || 'Failed to join video call');
    };

    callFrame.on('joined-meeting', handleJoinedMeeting);
    callFrame.on('left-meeting', handleLeftMeeting);
    callFrame.on('error', handleError);

    // Join the call automatically
    callFrame.join({ url });

    return () => {
      callFrame.off('joined-meeting', handleJoinedMeeting);
      callFrame.off('left-meeting', handleLeftMeeting);
      callFrame.off('error', handleError);
      callFrame.destroy();
    };
  }, [url, callObject, onLeave]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-2xl border border-red-500/30 p-8 text-center min-h-[500px]">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Connection Error</h3>
        <p className="text-slate-400 max-w-md mx-auto mb-6">{error}</p>
        <button
          onClick={onLeave}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium border border-slate-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col">
      <div className="w-full h-full flex-grow relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900" ref={containerRef}>
        {!callObject && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
            <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-medium animate-pulse">Initializing video call...</p>
          </div>
        )}
      </div>
    </div>
  );
}
