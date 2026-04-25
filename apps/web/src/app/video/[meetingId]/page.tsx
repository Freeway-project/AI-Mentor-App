'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SessionRoom } from '@/components/video/SessionRoom';

export default function VideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const meetingId = params.meetingId as string;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/login?redirect=/video/${meetingId}`);
      return;
    }

    // Backend enforces auth on getBooking (403 if not a participant)
    apiClient.getBooking(meetingId)
      .then(() => setAuthorized(true))
      .catch((err: any) => {
        setError(err.message || 'Failed to verify session access');
        toast.error('Could not join video session');
      })
      .finally(() => setLoading(false));
  }, [meetingId, user, authLoading, router]);

  const handleLeave = () => {
    if (user?.roles?.includes('mentor')) {
      router.push('/mentor/dashboard');
    } else {
      router.push('/mentee/dashboard');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-violet-500" />
        <p className="font-medium text-slate-400">Preparing your session room…</p>
      </div>
    );
  }

  if (error || !authorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-white">Access Denied</h1>
          <p className="mb-8 text-slate-400">{error}</p>
          <button
            onClick={handleLeave}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 font-medium text-white transition-colors hover:bg-slate-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <SessionRoom meetingId={meetingId} onLeave={handleLeave} />;
}
