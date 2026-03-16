'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SessionRoomPlaceholder } from '@/components/video/SessionRoomPlaceholder';
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
        
        // Ensure user is part of the meeting
        if (user.roles?.includes('mentee') && data.menteeId !== user.id && !user.roles?.includes('mentor')) {
          throw new Error('You are not authorized to join this session');
        }
        if (user.roles?.includes('mentor') && data.mentorId !== user.id && !user.roles?.includes('mentee')) {
          throw new Error('You are not authorized to join this session');
        }

        const sessionAccess = getSessionAccess({
          id: data.id,
          dailyRoomUrl: data.dailyRoomUrl,
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Preparing your session room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-8">{error}</p>
          <button
            onClick={handleLeave}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <SessionRoomPlaceholder meeting={meeting} onBack={handleLeave} />
      </div>
    </div>
  );
}
