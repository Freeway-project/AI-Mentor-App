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
      await apiClient.updateMyAvailability({
        timezone,
        schedule: slots,
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Availability</h2>
      <p className="text-sm text-slate-500">Set your weekly availability for sessions.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white placeholder:text-slate-400"
        >
          {Intl.supportedValuesOf('timeZone').map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      {/* Current slots */}
      {slots.length > 0 && (
        <div className="space-y-2">
          {slots.map((slot, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">
                <span className="font-medium">{DAYS[slot.dayOfWeek]}</span>{' '}
                {slot.startTime} - {slot.endTime}
              </span>
              <button onClick={() => removeSlot(i)} className="text-red-500 hover:text-red-700 p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add slot */}
      <div className="border-t pt-4 space-y-3">
        <h3 className="text-sm font-medium text-slate-700">Add a time slot</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Day</label>
            <select
              value={newDay}
              onChange={(e) => setNewDay(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white placeholder:text-slate-400"
            >
              {DAYS.map((day, i) => (
                <option key={i} value={i}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Start</label>
            <input
              type="time"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">End</label>
            <input
              type="time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white placeholder:text-slate-400"
            />
          </div>
        </div>
        <Button type="button" variant="outline" onClick={addSlot}>
          Add Slot
        </Button>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={loading || slots.length === 0}>
          {loading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  );
}
