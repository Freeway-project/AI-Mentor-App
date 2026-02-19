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
    }).catch(() => {});
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Session Policies</h2>
      <p className="text-sm text-slate-500">Set your cancellation and rescheduling rules.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Cancellation notice (hours)
        </label>
        <input
          type="number"
          min="0"
          value={cancellationHours}
          onChange={(e) => setCancellationHours(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-slate-400 mt-1">How many hours before a session can a mentee cancel?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Reschedule notice (hours)
        </label>
        <input
          type="number"
          min="0"
          value={rescheduleHours}
          onChange={(e) => setRescheduleHours(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">No-show policy</label>
        <input
          type="text"
          value={noShowPolicy}
          onChange={(e) => setNoShowPolicy(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. No refund for no-shows"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Custom terms (optional)</label>
        <textarea
          value={customTerms}
          onChange={(e) => setCustomTerms(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Any additional terms..."
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save & Continue'}
      </Button>
    </form>
  );
}
