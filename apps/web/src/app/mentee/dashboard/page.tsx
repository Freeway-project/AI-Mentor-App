'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { BrandLoader } from '@/components/brand/brand-loader';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { Calendar, Clock, CreditCard, ArrowRight, BookOpen, Video, X, RotateCcw, Star } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SlotPicker } from '@/components/booking/SlotPicker';
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

export default function MenteeDashboardPage() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [credits, setCredits] = useState<{ balance: number; heldBalance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Cancel state
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<{ start: string; end: string } | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  // Review state
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const load = useCallback(async () => {
    try {
      const [upcomingData, pastData, creditsData] = await Promise.all([
        apiClient.getMyBookings({ status: 'booked' }),
        apiClient.getMyBookings({ status: 'completed' }),
        apiClient.getCreditsBalance(),
      ]);

      const sorted = [...upcomingData.meetings].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );

      setUpcoming(sorted);
      setPast(pastData.meetings);
      setCredits(creditsData);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load dashboard');
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

  const handleReschedule = async (id: string) => {
    if (!newSlot) return;
    setRescheduling(true);
    try {
      await apiClient.rescheduleBooking(id, newSlot.start);
      toast.success('Session rescheduled');
      setReschedulingId(null);
      setNewSlot(null);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to reschedule');
    } finally {
      setRescheduling(false);
    }
  };

  const handleReview = async (id: string) => {
    if (!reviewRating) return;
    try {
      await apiClient.rateBooking(id, reviewRating, reviewText || undefined);
      toast.success('Review submitted!');
      setReviewingId(null);
      setReviewRating(0);
      setReviewText('');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit review');
    }
  };

  const nextSession = upcoming[0] ?? null;
  const nextSessionAccess = nextSession ? getSessionAccess(nextSession) : null;

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <BrandLoader label="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full min-w-0 max-w-5xl space-y-8 px-4 py-6 sm:px-6 md:py-8 md:px-8">
      <AppPageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'Learner'}`}
        description="Track credits, upcoming sessions, and reschedules from the same shared dashboard system."
        titleClassName="text-2xl md:text-3xl"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AppStatCard icon={<CreditCard className="h-5 w-5" />} label="Credits" value={credits?.balance ?? '—'} tone="amber" />
        <AppStatCard icon={<Calendar className="h-5 w-5" />} label="Upcoming" value={upcoming.length} tone="brand" />
        <AppStatCard icon={<BookOpen className="h-5 w-5" />} label="Sessions Done" value={past.length} tone="purple" />
      </div>

      <AppPanel className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Build a learning plan from your resume</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload your resume, define a target role, and get AI-generated skill gaps plus mentor suggestions.
          </p>
        </div>
        <Link
          href="/mentee/career"
          className="inline-flex items-center gap-1.5 rounded-xl border border-brand/20 bg-brand/10 px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/20 hover:text-brand-light"
        >
          Open Career Plan <ArrowRight className="h-4 w-4" />
        </Link>
      </AppPanel>

      {nextSession ? (
        <AppPanel className="flex items-start gap-4 border-brand/20 bg-brand/10 p-5">
          <div className="rounded-xl border border-brand/20 bg-brand/10 p-2.5 text-brand">
            <Clock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-brand">Next session</h2>
            <p className="text-slate-900 font-bold mt-0.5">{nextSession.title}</p>
            <p className="text-sm text-slate-600 mt-1">
              {formatDateTime(nextSession.scheduledAt)} · {nextSession.duration} min
            </p>
            {nextSessionAccess && (
              <Link
                href={nextSessionAccess.href}
                target={nextSessionAccess.isExternal ? '_blank' : undefined}
                rel={nextSessionAccess.isExternal ? 'noopener noreferrer' : undefined}
                className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-all shadow-lg shadow-brand/20 hover:bg-brand-light"
              >
                <Video className="w-4 h-4" />
                {nextSessionAccess.label}
              </Link>
            )}
          </div>
        </AppPanel>
      ) : (
        <AppPanel className="flex flex-col sm:flex-row items-start gap-5 border-brand/20 bg-brand/10 p-6">
          <div className="rounded-xl border border-brand/20 bg-brand/10 p-3 text-brand">
            <BookOpen className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-brand text-lg">Start your learning journey</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              You haven&apos;t booked any sessions yet. Browse our list of expert mentors across popular categories to get started.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] transition-all hover:bg-brand-light"
              >
                Find a mentor <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </AppPanel>
      )}

      {upcoming.length > 0 && (
        <section>
          <AppSectionLabel className="mb-4">Upcoming Sessions</AppSectionLabel>
          <div className="space-y-4">
            {upcoming.map(session => {
              const sessionAccess = getSessionAccess(session);

              return (
              <AppPanel key={session.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5">
                    <StatusBadge status={session.status} />
                    <p className="font-bold text-slate-900">{session.title}</p>
                    <p className="text-sm text-slate-500 font-medium">
                      {formatDateTime(session.scheduledAt)} · {session.duration} min
                    </p>
                    {sessionAccess && (
                      <Link
                        href={sessionAccess.href}
                        target={sessionAccess.isExternal ? '_blank' : undefined}
                        rel={sessionAccess.isExternal ? 'noopener noreferrer' : undefined}
                        className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/20 hover:text-brand-light"
                      >
                        <Video className="w-3.5 h-3.5" />
                        {sessionAccess.label}
                      </Link>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setReschedulingId(reschedulingId === session.id ? null : session.id);
                        setCancellingId(null);
                        setNewSlot(null);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-brand/40 hover:text-brand"
                    >
                      <RotateCcw className="w-3 h-3" /> Reschedule
                    </button>
                    <button
                      onClick={() => {
                        setCancellingId(cancellingId === session.id ? null : session.id);
                        setReschedulingId(null);
                        setCancelReason('');
                      }}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-red-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>

                {/* Cancel panel */}
                {cancellingId === session.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    <p className="text-sm text-slate-500">Reason for cancellation (optional)</p>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      placeholder="e.g. Schedule conflict"
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
                        className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-200"
                      >
                        Keep session
                      </button>
                    </div>
                  </div>
                )}

                {/* Reschedule panel */}
                {reschedulingId === session.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                    <p className="text-sm text-slate-500">Pick a new time</p>
                    <SlotPicker
                      mentorId={session.mentorId}
                      durationMin={session.duration}
                      onSlotSelect={setNewSlot}
                    />
                    {newSlot && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleReschedule(session.id)}
                          disabled={rescheduling}
                          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-light disabled:opacity-50"
                        >
                          {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                        </button>
                        <button
                          onClick={() => { setReschedulingId(null); setNewSlot(null); }}
                          className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-200"
                        >
                          Back
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </AppPanel>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <AppSectionLabel className="mb-4">Past Sessions</AppSectionLabel>
        {past.length === 0 ? (
          <AppPanel className="flex flex-col items-center p-8 text-center">
            <BookOpen className="w-10 h-10 text-slate-400 mb-3" />
            <p className="text-slate-400 font-medium">No sessions yet</p>
            <p className="text-slate-500 text-sm mt-1">Your completed sessions will appear here.</p>
          </AppPanel>
        ) : (
          <div className="space-y-3">
            {past.map(session => (
              <AppPanel key={session.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{session.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDateTime(session.scheduledAt)} · {session.duration} min
                    </p>
                    {session.rating != null && (
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`w-3 h-3 ${i <= session.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={session.status} />
                    {session.rating == null && (
                      <button
                        onClick={() => {
                          setReviewingId(reviewingId === session.id ? null : session.id);
                          setReviewRating(0);
                          setReviewText('');
                        }}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-amber-400 hover:text-amber-600"
                      >
                        <Star className="w-3 h-3" /> Rate
                      </button>
                    )}
                  </div>
                </div>

                {reviewingId === session.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    <p className="text-sm text-slate-500">How was your session?</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <button
                          key={i}
                          onClick={() => setReviewRating(i)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star className={`w-7 h-7 ${i <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      placeholder="Leave a comment (optional)"
                      className={cn(appTheme.input, 'px-3 py-2 text-sm')}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(session.id)}
                        disabled={!reviewRating}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Submit Review
                      </button>
                      <button
                        onClick={() => { setReviewingId(null); setReviewRating(0); setReviewText(''); }}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </AppPanel>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
