'use client';

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
  const meetLink = booking.meetUrl || booking.meetingLink;

  return (
    <div className="bg-slate-900 rounded-2xl border border-emerald-500/30 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <span className="text-emerald-400 text-xl">&#10003;</span>
        </div>
        <div>
          <h3 className="font-semibold text-white">Session booked!</h3>
          <p className="text-sm text-slate-400">Your session has been confirmed</p>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Session</span>
          <span className="text-slate-200 font-medium">{booking.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">When</span>
          <span className="text-slate-200">{formatDateTime(booking.scheduledAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Duration</span>
          <span className="text-slate-200">{booking.duration} min</span>
        </div>
        {meetLink && (
          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-500">Meet link</span>
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline text-xs break-all"
            >
              Join Google Meet
            </a>
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
