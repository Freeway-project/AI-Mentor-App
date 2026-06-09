'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { frontendLogger } from '@/lib/frontend-logger';

interface Slot {
  start: string;
  end: string;
}

interface Props {
  mentorId: string;
  durationMin: number;
  onSlotSelect: (slot: Slot) => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function weeksAheadISO(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function SlotPicker({ mentorId, durationMin, onSlotSelect }: Props) {
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(weeksAheadISO(2));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Slot | null>(null);

  useEffect(() => {
    if (!from || !to) return;
    setLoading(true);
    setError('');
    frontendLogger.info('Slot search started', {
      mentorId,
      from,
      to,
      durationMin,
    });
    apiClient.getAvailableSlots(mentorId, from, to, durationMin)
      .then(data => {
        setSlots(data.slots);
        frontendLogger.info('Slot search completed', {
          mentorId,
          from,
          to,
          durationMin,
          slots: data.slots.length,
        });
      })
      .catch(err => {
        frontendLogger.error('Slot search failed', {
          mentorId,
          from,
          to,
          durationMin,
          error: err.message || 'Failed to load slots',
        });
        setError(err.message || 'Failed to load slots');
      })
      .finally(() => setLoading(false));
  }, [mentorId, from, to, durationMin]);

  // Group slots by day
  const slotsByDay: Record<string, Slot[]> = {};
  for (const slot of slots) {
    const day = slot.start.slice(0, 10);
    if (!slotsByDay[day]) slotsByDay[day] = [];
    slotsByDay[day].push(slot);
  }

  const handleSelect = (slot: Slot) => {
    setSelected(slot);
    onSlotSelect(slot);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 uppercase tracking-wide">From</label>
          <input
            type="date"
            value={from}
            min={todayISO()}
            onChange={e => setFrom(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 uppercase tracking-wide">To</label>
          <input
            type="date"
            value={to}
            min={from}
            onChange={e => setTo(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Checking availability…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && slots.length === 0 && (
        <p className="text-sm text-slate-500">No open times in this date range — try widening the dates above.</p>
      )}

      {!loading && Object.entries(slotsByDay).map(([day, daySlots]) => (
        <div key={day}>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{formatDate(daySlots[0].start)}</p>
          <div className="flex flex-wrap gap-2">
            {daySlots.map(slot => (
              <button
                key={slot.start}
                onClick={() => handleSelect(slot)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors font-medium ${
                  selected?.start === slot.start
                    ? 'bg-brand border-brand text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-brand hover:text-brand'
                }`}
              >
                {formatTime(slot.start)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
