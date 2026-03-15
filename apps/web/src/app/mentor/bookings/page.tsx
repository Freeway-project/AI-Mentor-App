'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { Calendar, Clock, Video, RotateCcw, X, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function formatDateTime(iso: string | Date) {
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    booked: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    confirmed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    completed: 'bg-slate-700/50 text-slate-400 border-slate-700',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status] ?? styles.completed}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function MentorBookingsPage() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancel state
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    try {
      const [upcomingData, pastData] = await Promise.all([
        apiClient.getMyBookings({ status: 'booked' }),
        apiClient.getMyBookings({ status: 'completed' }),
      ]);

      const sorted = [...upcomingData.meetings].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );

      setUpcoming(sorted);
      setPast(pastData.meetings);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id: string) => {
    try {
      await apiClient.cancelBooking(id, cancelReason || undefined);
      toast.success('Session cancelled');
      setCancellingId(null);
      setCancelReason('');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel');
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <p className="text-slate-500 text-sm animate-pulse">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Your Bookings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage all your scheduled and past sessions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Upcoming</p>
            <p className="text-2xl font-bold text-white">{upcoming.length}</p>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Completed</p>
            <p className="text-2xl font-bold text-white">{past.length}</p>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Earned</p>
            <p className="text-2xl font-bold text-white">
              ${past.reduce((sum: number, s: any) => sum + (s.amountPaid ?? 0), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming sessions */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Upcoming Sessions
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
            <p className="text-slate-400">No upcoming sessions right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map(session => (
              <div key={session.id} className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5">
                    <StatusBadge status={session.status} />
                    <p className="font-semibold text-white">{session.title}</p>
                    {session.menteeName && (
                      <p className="text-xs text-slate-500">with {session.menteeName}</p>
                    )}
                    <p className="text-sm text-slate-400">
                      {formatDateTime(session.scheduledAt)} · {session.duration} min
                    </p>
                    
                    {/* VIDEO CTA */}
                    {(session.dailyRoomUrl || session.meetUrl || session.meetingLink) && (
                      <Link
                        href={
                          session.dailyRoomUrl
                            ? `/video/${session.id}`
                            : (session.meetUrl || session.meetingLink)
                        }
                        target={session.dailyRoomUrl ? undefined : "_blank"}
                        rel={session.dailyRoomUrl ? undefined : "noopener noreferrer"}
                        className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-500/20 w-fit"
                      >
                        <Video className="w-4 h-4" /> 
                        {session.dailyRoomUrl ? 'Join Video Call' : 'Join External Meeting'}
                      </Link>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setCancellingId(cancellingId === session.id ? null : session.id);
                        setCancelReason('');
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:border-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>

                {/* Cancel panel */}
                {cancellingId === session.id && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    <p className="text-sm text-slate-400">Reason for cancellation</p>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      placeholder="e.g. Personal emergency"
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancel(session.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Confirm Cancel
                      </button>
                      <button
                        onClick={() => { setCancellingId(null); setCancelReason(''); }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
                      >
                        Keep session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past sessions */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Past Sessions
        </h2>
        {past.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
            <p className="text-slate-400 font-medium">No sessions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map(session => (
              <div key={session.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-200 text-sm">{session.title}</p>
                  {session.menteeName && (
                    <p className="text-xs text-slate-400">with {session.menteeName}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDateTime(session.scheduledAt)} · {session.duration} min
                  </p>
                </div>
                <StatusBadge status={session.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
