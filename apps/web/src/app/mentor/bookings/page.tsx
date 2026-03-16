'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { Calendar, Clock, Video, X, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AppPageHeader,
  AppPanel,
  AppSectionLabel,
  AppStatCard,
  AppStatusBadge,
  appTheme,
} from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';
import { getSessionAccess } from '@/lib/session-access';

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
  const tones: Record<string, 'brand' | 'purple' | 'slate' | 'red' | 'amber'> = {
    booked: 'brand',
    confirmed: 'purple',
    completed: 'slate',
    cancelled: 'red',
    in_progress: 'amber',
  };
  return (
    <AppStatusBadge tone={tones[status] ?? 'slate'}>
      {status.replace('_', ' ')}
    </AppStatusBadge>
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
      <div className="mx-auto max-w-5xl p-8">
        <p className="text-slate-500 text-sm animate-pulse">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
      <AppPageHeader
        title="Your Bookings"
        description="Manage scheduled sessions, join calls, and keep your calendar clean from one shared dashboard layout."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AppStatCard icon={<Calendar className="h-5 w-5" />} label="Upcoming" value={upcoming.length} tone="brand" />
        <AppStatCard icon={<Clock className="h-5 w-5" />} label="Completed" value={past.length} tone="slate" />
        <AppStatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Earned"
          value={`$${past.reduce((sum: number, s: any) => sum + (s.amountPaid ?? 0), 0).toFixed(2)}`}
          tone="emerald"
        />
      </div>

      <section>
        <AppSectionLabel className="mb-4">Upcoming Sessions</AppSectionLabel>
        {upcoming.length === 0 ? (
          <AppPanel className="p-8 text-center">
            <p className="text-slate-400">No upcoming sessions right now.</p>
          </AppPanel>
        ) : (
          <div className="space-y-4">
            {upcoming.map(session => {
              const sessionAccess = getSessionAccess(session);

              return (
              <AppPanel key={session.id} className="p-5">
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
                    {sessionAccess && (
                      <Link
                        href={sessionAccess.href}
                        target={sessionAccess.isExternal ? "_blank" : undefined}
                        rel={sessionAccess.isExternal ? "noopener noreferrer" : undefined}
                        className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-all shadow-lg shadow-brand/20 hover:bg-brand-light"
                      >
                        <Video className="w-4 h-4" /> 
                        {sessionAccess.label}
                      </Link>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setCancellingId(cancellingId === session.id ? null : session.id);
                        setCancelReason('');
                      }}
                      className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-red-500 hover:text-red-300"
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
                      className={cn(appTheme.input, 'px-3 py-2 text-sm focus:ring-red-500/30')}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancel(session.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
                      >
                        Confirm Cancel
                      </button>
                      <button
                        onClick={() => { setCancellingId(null); setCancelReason(''); }}
                        className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700"
                      >
                        Keep session
                      </button>
                    </div>
                  </div>
                )}
              </AppPanel>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <AppSectionLabel className="mb-4">Past Sessions</AppSectionLabel>
        {past.length === 0 ? (
          <AppPanel className="p-8 text-center">
            <p className="text-slate-400 font-medium">No sessions yet</p>
          </AppPanel>
        ) : (
          <div className="space-y-3">
            {past.map(session => (
              <AppPanel key={session.id} className="flex items-center justify-between gap-4 p-4">
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
              </AppPanel>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
