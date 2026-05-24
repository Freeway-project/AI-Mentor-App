'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { appTheme } from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';

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
  const [timezone, setTimezone] = useState(
    profile?.availability?.timezone || 'America/New_York'
  );
  const [slots, setSlots] = useState<Slot[]>(profile?.availability?.schedule || []);
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');

  const [cancellationHours, setCancellationHours] = useState('24');
  const [rescheduleHours, setRescheduleHours] = useState('12');
  const [noShowPolicy, setNoShowPolicy] = useState('No refund for no-shows');
  const [customTerms, setCustomTerms] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient
      .getMyPolicies()
      .then((policy) => {
        if (policy) {
          setCancellationHours(policy.cancellationHours?.toString() || '24');
          setRescheduleHours(policy.rescheduleHours?.toString() || '12');
          setNoShowPolicy(policy.noShowPolicy || 'No refund for no-shows');
          setCustomTerms(policy.customTerms || '');
        }
      })
      .catch(() => {});
  }, []);

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
      await apiClient.upsertPolicies({
        cancellationHours: Number(cancellationHours),
        rescheduleHours: Number(rescheduleHours),
        noShowPolicy,
        customTerms: customTerms || undefined,
      });
      await apiClient.updateMyAvailability({ timezone, schedule: slots });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = cn(appTheme.input, 'text-sm py-2.5');
  const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider';
  const hintCls = 'text-xs text-slate-500 mt-1';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Schedule & Rules</h2>
        <p className="mt-1 text-sm text-slate-600">
          Set your weekly availability and cancellation policies for mentees.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Weekly Availability</h3>

        <div>
          <label className={labelCls}>Your Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={cn(inputCls, 'cursor-pointer')}
          >
            {Intl.supportedValuesOf('timeZone').map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {slots.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scheduled Slots</p>
            {slots.map((slot, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5"
              >
                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs font-bold text-brand">{DAYS[slot.dayOfWeek]}</span>
                  <span className="text-sm text-slate-700">
                    {slot.startTime} – {slot.endTime}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 border-t border-slate-200 pt-4">
          <h4 className="text-sm font-medium text-slate-700">Add a time slot</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Day</label>
              <select
                value={newDay}
                onChange={(e) => setNewDay(Number(e.target.value))}
                className={cn(inputCls, 'cursor-pointer')}
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Start</label>
              <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End</label>
              <input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className={inputCls} />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addSlot}
            className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
          >
            + Add Slot
          </Button>
        </div>
      </section>

      <div className="border-t border-slate-200" />

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Cancellation Policies</h3>

        <div>
          <label className={labelCls}>Cancellation Notice</label>
          <select
            value={cancellationHours}
            onChange={(e) => setCancellationHours(e.target.value)}
            className={cn(inputCls, 'cursor-pointer')}
          >
            <option value="12">12 hours before</option>
            <option value="24">24 hours before</option>
            <option value="48">48 hours before</option>
            <option value="72">72 hours before</option>
          </select>
          <p className={hintCls}>How many hours before a session can a mentee cancel?</p>
        </div>

        <div>
          <label className={labelCls}>Reschedule Notice</label>
          <select
            value={rescheduleHours}
            onChange={(e) => setRescheduleHours(e.target.value)}
            className={cn(inputCls, 'cursor-pointer')}
          >
            <option value="12">12 hours before</option>
            <option value="24">24 hours before</option>
            <option value="48">48 hours before</option>
            <option value="72">72 hours before</option>
          </select>
          <p className={hintCls}>How many hours before a session can a mentee reschedule?</p>
        </div>

        <div>
          <label className={labelCls}>No-Show Policy</label>
          <input
            type="text"
            value={noShowPolicy}
            onChange={(e) => setNoShowPolicy(e.target.value)}
            className={inputCls}
            placeholder="e.g. No refund for no-shows"
          />
        </div>

        <div>
          <label className={labelCls}>
            Custom Terms <span className="normal-case font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            value={customTerms}
            onChange={(e) => setCustomTerms(e.target.value)}
            className={inputCls}
            rows={3}
            placeholder="Any additional terms or conditions…"
          />
        </div>
      </section>

      <div className="flex justify-end pt-1">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading || slots.length === 0}
          className="bg-brand text-white hover:bg-brand-light"
        >
          {loading ? 'Saving…' : 'Save & Continue →'}
        </Button>
      </div>
    </div>
  );
}
