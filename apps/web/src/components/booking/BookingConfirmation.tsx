'use client';

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getSessionAccess } from '@/lib/session-access';
import { ED } from '@/components/mentor-profile/editorial-theme';

interface Props {
  booking: {
    id: string;
    title: string;
    scheduledAt: string | Date;
    duration: number;
    meetUrl?: string;
    meetingLink?: string;
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
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4 border"
          style={{ background: ED.accentTint, borderColor: ED.rule }}
        >
          <CheckCircle className="w-7 h-7" style={{ color: ED.accent }} />
        </div>
        <h3 className="text-xl" style={{ fontFamily: '"Instrument Serif", serif', color: ED.ink, fontWeight: 400 }}>
          Session booked!
        </h3>
        <p className="text-sm mt-1" style={{ color: ED.inkMuted }}>
          A confirmation email is on its way to you.
        </p>
      </div>

      <div
        className="rounded-xl p-4 space-y-2.5 text-sm border"
        style={{ background: ED.creamDeep + '99', borderColor: ED.rule }}
      >
        <div className="flex justify-between gap-3">
          <span style={{ color: ED.inkMuted }}>Session</span>
          <span className="font-medium text-right" style={{ color: ED.ink }}>
            {booking.title}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span style={{ color: ED.inkMuted }}>When</span>
          <span className="text-right max-w-[60%]" style={{ color: ED.inkSoft }}>
            {formatDateTime(booking.scheduledAt)}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: ED.inkMuted }}>Duration</span>
          <span style={{ color: ED.inkSoft }}>{booking.duration} min</span>
        </div>
        {sessionAccess && (
          <div className="pt-2 border-t" style={{ borderColor: ED.rule }}>
            <Link
              href={sessionAccess.href}
              target={sessionAccess.isExternal ? '_blank' : undefined}
              rel={sessionAccess.isExternal ? 'noopener noreferrer' : undefined}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-white font-semibold rounded-lg transition-opacity text-sm hover:opacity-90"
              style={{ background: ED.ink }}
            >
              {sessionAccess.label} →
            </Link>
            <p className="text-center text-xs mt-2 break-all" style={{ color: ED.inkMuted }}>
              {sessionAccess.href}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full py-2.5 text-sm font-medium rounded-lg transition-colors border"
        style={{
          background: ED.card,
          color: ED.inkSoft,
          borderColor: ED.rule,
        }}
      >
        Done
      </button>
    </div>
  );
}
