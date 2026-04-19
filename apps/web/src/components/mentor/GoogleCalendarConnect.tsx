'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface Props {
  onStatusChange?: (connected: boolean) => void;
}

export function GoogleCalendarConnect({ onStatusChange }: Props) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    apiClient.getGoogleCalendarStatus()
      .then(({ connected }) => {
        setConnected(connected);
        onStatusChange?.(connected);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // onStatusChange is intentionally excluded — it's a callback prop that runs once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = () => {
    // Redirect the browser so the backend can set the auth cookie/state
    apiClient.startGoogleCalendarOAuth();
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await apiClient.disconnectGoogleCalendar();
      setConnected(false);
      onStatusChange?.(false);
      toast.success('Google Calendar disconnected');
    } catch {
      toast.error('Failed to disconnect Google Calendar');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full bg-slate-700 animate-pulse" />
        <span className="text-sm text-slate-500">Checking connection...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-purple-400' : 'bg-slate-600'}`} />
        <span className="text-sm text-slate-300">
          {connected ? 'Connected to Google Calendar' : 'Not connected'}
        </span>
      </div>
      {connected ? (
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
        >
          {disconnecting ? 'Disconnecting...' : 'Disconnect'}
        </button>
      ) : (
        <button
          onClick={handleConnect}
          className="text-sm bg-brand hover:bg-brand text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          Connect Google Calendar
        </button>
      )}
    </div>
  );
}
