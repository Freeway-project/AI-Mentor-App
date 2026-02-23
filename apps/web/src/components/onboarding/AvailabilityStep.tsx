'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface AvailabilityStepProps {
  profile: any;
  onComplete: () => void;
}

interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function AvailabilityStep({ profile, onComplete }: AvailabilityStepProps) {
  const [timezone, setTimezone] = useState(profile?.availability?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [slots, setSlots] = useState<Slot[]>(profile?.availability?.schedule || []);
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addSlot = () => {
    setSlots([...slots, { dayOfWeek: newDay, startTime: newStart, endTime: newEnd }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await apiClient.updateMyAvailability({ timezone, schedule: slots });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save availability');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 bg-slate-800/60 text-white placeholder:text-slate-500 text-sm';
  const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Availability</h2>
        <p className="text-sm text-slate-400 mt-1">Set your weekly recurring time slots for mentoring sessions.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div>
        <label className={labelCls}>Your Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className={`${inputCls} cursor-pointer`}
        >
          {Intl.supportedValuesOf('timeZone').map((tz) => (
            <option key={tz} value={tz} className="bg-slate-900">{tz}</option>
          ))}
        </select>
      </div>

      {/* Current slots */}
      {slots.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled Slots</p>
          {slots.map((slot, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-violet-400 w-24">{DAYS[slot.dayOfWeek]}</span>
                <span className="text-sm text-slate-300">{slot.startTime} – {slot.endTime}</span>
              </div>
              <button
                onClick={() => removeSlot(i)}
                className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add slot */}
      <div className="border-t border-slate-700/50 pt-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Add a time slot</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Day</label>
            <select
              value={newDay}
              onChange={(e) => setNewDay(Number(e.target.value))}
              className={`${inputCls} cursor-pointer`}
            >
              {DAYS.map((day, i) => (
                <option key={i} value={i} className="bg-slate-900">{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Start</label>
            <input
              type="time"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>End</label>
            <input
              type="time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addSlot}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          + Add Slot
        </Button>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          onClick={handleSubmit}
          disabled={loading || slots.length === 0}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          {loading ? 'Saving…' : 'Save & Continue →'}
        </Button>
      </div>
    </div>
  );
}
