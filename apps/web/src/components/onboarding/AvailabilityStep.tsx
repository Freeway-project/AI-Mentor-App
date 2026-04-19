'use client';

import { useState, useEffect } from 'react';
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
  // availability
  const [timezone, setTimezone] = useState(profile?.availability?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [slots, setSlots] = useState<Slot[]>(profile?.availability?.schedule || []);
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');

  // policies
  const [cancellationHours, setCancellationHours] = useState('24');
  const [rescheduleHours, setRescheduleHours] = useState('12');
  const [noShowPolicy, setNoShowPolicy] = useState('No refund for no-shows');
  const [customTerms, setCustomTerms] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.getMyPolicies().then((policy) => {
      if (policy) {
        setCancellationHours(policy.cancellationHours?.toString() || '24');
        setRescheduleHours(policy.rescheduleHours?.toString() || '12');
        setNoShowPolicy(policy.noShowPolicy || 'No refund for no-shows');
        setCustomTerms(policy.customTerms || '');
      }
    }).catch(() => { });
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
      // Save policies first (non-blocking step advancement)
      await apiClient.upsertPolicies({
        cancellationHours: Number(cancellationHours),
        rescheduleHours: Number(rescheduleHours),
        noShowPolicy,
        customTerms: customTerms || undefined,
      });
      // Save availability — this advances the onboarding step availability → review
      await apiClient.updateMyAvailability({ timezone, schedule: slots });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 bg-slate-800/60 text-white placeholder:text-slate-500 text-sm';
  const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider';
  const hintCls = 'text-xs text-slate-600 mt-1';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Schedule & Rules</h2>
        <p className="text-sm text-slate-400 mt-1">Set your weekly availability and cancellation policies for mentees.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* ── Availability ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Weekly Availability</h3>

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

        {slots.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled Slots</p>
            {slots.map((slot, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-brand-light w-24">{DAYS[slot.dayOfWeek]}</span>
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

        <div className="border-t border-slate-700/50 pt-4 space-y-3">
          <h4 className="text-sm font-medium text-slate-400">Add a time slot</h4>
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
            className="bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200"
          >
            + Add Slot
          </Button>
        </div>
      </section>

      <div className="border-t border-slate-700/50" />

      {/* ── Policies ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Cancellation Policies</h3>

        <div>
          <label className={labelCls}>Cancellation Notice (hours)</label>
          <input
            type="number"
            min="0"
            value={cancellationHours}
            onChange={(e) => setCancellationHours(e.target.value)}
            className={inputCls}
          />
          <p className={hintCls}>How many hours before a session can a mentee cancel?</p>
        </div>

        <div>
          <label className={labelCls}>Reschedule Notice (hours)</label>
          <input
            type="number"
            min="0"
            value={rescheduleHours}
            onChange={(e) => setRescheduleHours(e.target.value)}
            className={inputCls}
          />
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
          <label className={labelCls}>Custom Terms <span className="normal-case font-normal text-slate-600">(optional)</span></label>
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
          onClick={handleSubmit}
          disabled={loading || slots.length === 0}
          className="bg-brand hover:bg-brand text-white"
        >
          {loading ? 'Saving…' : 'Save & Continue →'}
        </Button>
      </div>
    </div>
  );
}
