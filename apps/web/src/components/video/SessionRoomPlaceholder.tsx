'use client';

import { ArrowLeft, ArrowUpRight, Calendar, Clock, Video, Wrench } from 'lucide-react';
import Link from 'next/link';
import { AppPanel, AppStatusBadge } from '@/components/ui/app-theme';
import { getSessionAccess, type SessionAccessInput } from '@/lib/session-access';

interface SessionRoomPlaceholderProps {
  meeting: SessionAccessInput & {
    title?: string | null;
    duration?: number | null;
    scheduledAt?: string | Date | null;
  };
  onBack: () => void;
}

function formatSessionTime(value?: string | Date | null) {
  if (!value) return null;

  return new Date(value).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionRoomPlaceholder({ meeting, onBack }: SessionRoomPlaceholderProps) {
  const sessionAccess = getSessionAccess(meeting);
  const externalJoinLink = sessionAccess?.isExternal ? sessionAccess : null;
  const scheduledAt = formatSessionTime(meeting.scheduledAt);

  return (
    <div className="w-full max-w-5xl">
      <AppPanel className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border-b border-white/10 p-6 md:p-8 lg:border-b-0 lg:border-r">
            <AppStatusBadge tone="amber">Room update in progress</AppStatusBadge>
            <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand-lighter">
              <Video className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">Session room coming soon</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              The previous in-app video room has been removed while we switch the experience to LiveKit.
              This placeholder keeps session links working without dropping users into a broken screen.
            </p>

            <div className="mt-6 grid gap-3 text-sm text-slate-300">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <Wrench className="mt-0.5 h-5 w-5 text-amber-300" />
                <div>
                  <p className="font-medium text-white">What happens right now</p>
                  <p className="mt-1 text-slate-400">
                    Use an external meeting link when one is available. Native in-app rooms will return after the LiveKit integration is ready.
                  </p>
                </div>
              </div>

              {externalJoinLink ? (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <ArrowUpRight className="mt-0.5 h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="font-medium text-white">External meeting available</p>
                    <p className="mt-1 text-slate-300">
                      This booking already has an external meeting link, so you can still join it directly.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {externalJoinLink ? (
                <Link
                  href={externalJoinLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-light"
                >
                  {externalJoinLink.label}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : null}
              <button
                onClick={onBack}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-5 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to dashboard
              </button>
            </div>
          </div>

          <div className="bg-slate-950/40 p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Session Snapshot</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Title</p>
                <p className="mt-2 text-lg font-semibold text-white">{meeting.title || 'Mentorship Session'}</p>
              </div>

              {scheduledAt ? (
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <Calendar className="mt-0.5 h-5 w-5 text-brand-lighter" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Scheduled for</p>
                    <p className="mt-1 text-sm font-medium text-slate-200">{scheduledAt}</p>
                  </div>
                </div>
              ) : null}

              {meeting.duration ? (
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <Clock className="mt-0.5 h-5 w-5 text-brand-lighter" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Duration</p>
                    <p className="mt-1 text-sm font-medium text-slate-200">{meeting.duration} min</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </AppPanel>
    </div>
  );
}
