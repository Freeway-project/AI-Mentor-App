'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { Calendar, Clock, CreditCard, ArrowRight, BookOpen, Video, X, RotateCcw, Plus, Search, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SlotPicker } from '@/components/booking/SlotPicker';

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

export default function MenteeDashboardPage() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [credits, setCredits] = useState<{ balance: number; heldBalance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Cancel state
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Transcript state
  const [viewingTranscriptId, setViewingTranscriptId] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Record<string, any>>({});
  const [transcriptLoading, setTranscriptLoading] = useState<string | null>(null);

  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<{ start: string; end: string } | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

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

  const handleViewTranscript = async (id: string) => {
    if (viewingTranscriptId === id) {
      setViewingTranscriptId(null);
      return;
    }
    setViewingTranscriptId(id);
    if (transcripts[id]) return;
    setTranscriptLoading(id);
    try {
      const data = await apiClient.getTranscript(id);
      setTranscripts(prev => ({ ...prev, [id]: data }));
    } catch {
      setTranscripts(prev => ({ ...prev, [id]: null }));
    } finally {
      setTranscriptLoading(null);
    }
  };

  const nextSession = upcoming[0] ?? null;

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <p className="text-slate-500 text-sm animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here&apos;s your learning overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Credits</p>
            <p className="text-2xl font-bold text-white">{credits?.balance ?? '—'}</p>
          </div>
        </div>
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
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Sessions done</p>
            <p className="text-2xl font-bold text-white">{past.length}</p>
          </div>
        </div>
      </div>

      {/* Banner */}
      {nextSession ? (
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-violet-500/10">
            <Clock className="w-6 h-6 text-violet-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-violet-400">Next session</h2>
            <p className="text-white font-medium mt-0.5">{nextSession.title}</p>
            <p className="text-sm text-slate-400 mt-1">
              {formatDateTime(nextSession.scheduledAt)} · {nextSession.duration} min
            </p>
            {(nextSession.dailyRoomUrl || nextSession.meetUrl || nextSession.meetingLink) && (
              <Link
                href={
                  nextSession.dailyRoomUrl
                    ? `/video/${nextSession.id}`
                    : (nextSession.meetUrl || nextSession.meetingLink)
                }
                target={nextSession.dailyRoomUrl ? undefined : "_blank"}
                rel={nextSession.dailyRoomUrl ? undefined : "noopener noreferrer"}
                className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-500/20 w-fit"
              >
                <Video className="w-4 h-4" /> 
                {nextSession.dailyRoomUrl ? 'Join Video Call' : 'Join External Meeting'}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-violet-500/10">
            <Clock className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-violet-400">Find your first mentor</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              You haven&apos;t booked any sessions yet. Browse our list of expert mentors to get started.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-violet-400 hover:underline"
            >
              Browse mentors <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Upcoming sessions */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Upcoming Sessions
          </h2>
          <div className="space-y-4">
            {upcoming.map(session => (
              <div key={session.id} className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5">
                    <StatusBadge status={session.status} />
                    <p className="font-semibold text-white">{session.title}</p>
                    <p className="text-sm text-slate-400">
                      {formatDateTime(session.scheduledAt)} · {session.duration} min
                    </p>
                    {(session.dailyRoomUrl || session.meetUrl || session.meetingLink) && (
                      <Link
                        href={
                          session.dailyRoomUrl
                            ? `/video/${session.id}`
                            : (session.meetUrl || session.meetingLink)
                        }
                        target={session.dailyRoomUrl ? undefined : "_blank"}
                        rel={session.dailyRoomUrl ? undefined : "noopener noreferrer"}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs font-medium rounded-lg transition-colors border border-violet-500/20 w-fit mt-1"
                      >
                        <Video className="w-3.5 h-3.5" /> 
                        {session.dailyRoomUrl ? 'Join Video Call' : 'Join External Meeting'}
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
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:border-violet-500 hover:text-violet-400 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reschedule
                    </button>
                    <button
                      onClick={() => {
                        setCancellingId(cancellingId === session.id ? null : session.id);
                        setReschedulingId(null);
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
                    <p className="text-sm text-slate-400">Reason for cancellation (optional)</p>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      placeholder="e.g. Schedule conflict"
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

                {/* Reschedule panel */}
                {reschedulingId === session.id && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                    <p className="text-sm text-slate-400">Pick a new time</p>
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
                          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                        </button>
                        <button
                          onClick={() => { setReschedulingId(null); setNewSlot(null); }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
                        >
                          Back
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Past sessions */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Past Sessions
        </h2>
        {past.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 flex flex-col items-center text-center">
            <BookOpen className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-400 font-medium">No sessions yet</p>
            <p className="text-slate-500 text-sm mt-1">Your completed sessions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map(session => (
              <div key={session.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-200 text-sm">{session.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDateTime(session.scheduledAt)} · {session.duration} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={session.status} />
                    <button
                      onClick={() => handleViewTranscript(session.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:border-violet-500 hover:text-violet-400 transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      Summary
                      {viewingTranscriptId === session.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {viewingTranscriptId === session.id && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    {transcriptLoading === session.id ? (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading summary...
                      </div>
                    ) : transcripts[session.id] === null ? (
                      <p className="text-sm text-slate-500">No summary available yet. Check your email or try again later.</p>
                    ) : transcripts[session.id] ? (
                      <>
                        {transcripts[session.id].summary && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Summary</p>
                            <p className="text-sm text-slate-300 leading-relaxed">{transcripts[session.id].summary}</p>
                          </div>
                        )}
                        {transcripts[session.id].actionItems?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Action Items</p>
                            <ul className="space-y-1">
                              {transcripts[session.id].actionItems.map((item: string, i: number) => (
                                <li key={i} className="text-sm text-slate-300 flex gap-2">
                                  <span className="text-violet-400 mt-0.5">•</span> {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {transcripts[session.id].keyTopics?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Key Topics</p>
                            <div className="flex flex-wrap gap-2">
                              {transcripts[session.id].keyTopics.map((topic: string, i: number) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{topic}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {transcripts[session.id].durationSeconds && (
                          <p className="text-xs text-slate-600">Session duration: {Math.round(transcripts[session.id].durationSeconds / 60)} min recorded</p>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
