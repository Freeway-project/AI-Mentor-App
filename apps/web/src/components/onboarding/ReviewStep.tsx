'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ReviewStepProps {
  profile: any;
  onPublish: () => void;
}

export function ReviewStep({ profile, onPublish }: ReviewStepProps) {
  const [offers, setOffers] = useState<any[]>([]);
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.getMyOffers().then(setOffers).catch(() => {}),
      apiClient.getMyPolicies().then(setPolicy).catch(() => {}),
    ]);
  }, []);

  const handlePublish = async () => {
    setError('');
    setLoading(true);
    try {
      await onPublish();
    } catch (err: any) {
      setError(err.message || 'Failed to publish profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review & Publish</h2>
      <p className="text-sm text-slate-500">Review your profile before publishing.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Profile summary */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium">Profile</h3>
        <div className="text-sm space-y-1">
          <p><span className="text-slate-500">Name:</span> {profile?.name}</p>
          <p><span className="text-slate-500">Headline:</span> {profile?.headline || 'Not set'}</p>
          <p><span className="text-slate-500">Bio:</span> {profile?.bio || 'Not set'}</p>
          <p><span className="text-slate-500">Specialties:</span> {profile?.specialties?.join(', ') || 'None'}</p>
          <p><span className="text-slate-500">Hourly Rate:</span> {profile?.hourlyRate ? `$${profile.hourlyRate}` : 'Not set'}</p>
        </div>
      </div>

      {/* Offers */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium">Offers ({offers.length})</h3>
        {offers.map((offer) => (
          <div key={offer.id} className="text-sm">
            {offer.title} - {offer.durationMinutes} min - ${offer.price}
          </div>
        ))}
      </div>

      {/* Policy */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium">Policies</h3>
        {policy ? (
          <div className="text-sm space-y-1">
            <p>Cancellation: {policy.cancellationHours}h notice</p>
            <p>Reschedule: {policy.rescheduleHours}h notice</p>
            <p>No-show: {policy.noShowPolicy}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Not set</p>
        )}
      </div>

      {/* Availability */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium">Availability</h3>
        {profile?.availability?.schedule?.length > 0 ? (
          <div className="text-sm space-y-1">
            <p className="text-slate-500">Timezone: {profile.availability.timezone}</p>
            {profile.availability.schedule.map((slot: any, i: number) => (
              <p key={i}>{DAYS[slot.dayOfWeek]}: {slot.startTime} - {slot.endTime}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Not set</p>
        )}
      </div>

      <Button onClick={handlePublish} disabled={loading} className="w-full">
        {loading ? 'Publishing...' : 'Publish Profile'}
      </Button>
    </div>
  );
}
