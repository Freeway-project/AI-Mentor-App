'use client';

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getSessionAccess } from '@/lib/session-access';

interface Props {
  booking: {
    id: string;
    title: string;
    scheduledAt: string | Date;
    duration: number;
    meetUrl?: string;
    meetingLink?: string;
    dailyRoomUrl?: string;
  };
  onClose: () => void;
}

function formatDateTime(d: string | Date): string {
  return new Date(d).toLocaleString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BookingConfirmation({ booking, onClose }: Props) {
  const sessionAccess = getSessionAccess(booking);

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
          <CheckCircle className="w-7 h-7 text-violet-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Session booked!</h3>
        <p className="text-sm text-slate-400 mt-1">A confirmation email is on its way to you.</p>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Session</span>
          <span className="text-slate-200 font-medium">{booking.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">When</span>
          <span className="text-slate-200 text-right max-w-[60%]">{formatDateTime(booking.scheduledAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Duration</span>
          <span className="text-slate-200">{booking.duration} min</span>
        </div>
        {sessionAccess && (
          <div className="pt-2 border-t border-slate-700">
            <Link
              href={sessionAccess.href}
              target={sessionAccess.isExternal ? '_blank' : undefined}
              rel={sessionAccess.isExternal ? 'noopener noreferrer' : undefined}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {sessionAccess.label} →
            </Link>
            <p className="text-center text-xs text-slate-500 mt-2 break-all">{sessionAccess.href}</p>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full py-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
      >
        Done
      </button>
    </div>
  );
}
