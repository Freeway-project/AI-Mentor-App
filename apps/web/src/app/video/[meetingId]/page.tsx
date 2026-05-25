'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SessionRoomPlaceholder } from '@/components/video/SessionRoomPlaceholder';
import { LiveKitRoom } from '@/components/video/LiveKitRoom';
import { getSessionAccess, hasLegacySessionRoom } from '@/lib/session-access';

export default function VideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const meetingId = params.meetingId as string;

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push(`/login?redirect=/video/${meetingId}`);
      return;
    }

    const fetchMeeting = async () => {
      try {
        const data = await apiClient.getBooking(meetingId);

        const sessionAccess = getSessionAccess({
          id: data.id,
          livekitRoomName: data.livekitRoomName,
          meetUrl: data.meetUrl,
          meetingLink: data.meetingLink,
        });

        if (!sessionAccess && !hasLegacySessionRoom(data)) {
          throw new Error('No session room has been generated for this booking yet');
        }

        setMeeting(data);
      } catch (err: any) {
        console.error('Failed to load meeting:', err);
        setError(err.message || 'Failed to initialize video session');
        toast.error('Could not join video session');
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId, user, authLoading, router]);

  const handleLeave = () => {
    // Navigate back to the appropriate dashboard
    if (user?.roles?.includes('mentor')) {
      router.push('/mentor/dashboard');
    } else {
      router.push('/mentee/dashboard');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Preparing your session room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-8">{error}</p>
          <button
            onClick={handleLeave}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-900 rounded-xl transition-colors font-medium border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (meeting?.livekitRoomName) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 py-4">
        <LiveKitRoom meetingId={meetingId} onLeave={handleLeave} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <SessionRoomPlaceholder meeting={meeting} onBack={handleLeave} />
      </div>
    </div>
  );
}
