'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

interface PoliciesStepProps {
  mentorId: string;
  onComplete: () => void;
}

export function PoliciesStep({ mentorId, onComplete }: PoliciesStepProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.upsertPolicies({
        cancellationHours: Number(cancellationHours),
        rescheduleHours: Number(rescheduleHours),
        noShowPolicy,
        customTerms: customTerms || undefined,
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save policies');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 bg-slate-800/60 text-white placeholder:text-slate-500 text-sm';
  const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider';
  const hintCls = 'text-xs text-slate-600 mt-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Session Policies</h2>
        <p className="text-sm text-slate-400 mt-1">Set your cancellation and rescheduling rules for mentees.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

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
        <label className={labelCls}>Custom Terms (optional)</label>
        <textarea
          value={customTerms}
          onChange={(e) => setCustomTerms(e.target.value)}
          className={inputCls}
          rows={3}
          placeholder="Any additional terms or conditions..."
        />
      </div>

      <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white w-full">
        {loading ? 'Saving…' : 'Save & Continue →'}
      </Button>
    </form>
  );
}
