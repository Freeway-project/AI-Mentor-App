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
      setError(err.message || 'Failed to submit profile');
    } finally {
      setLoading(false);
    }
  };

  const sectionCls = 'space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4';
  const rowCls = 'grid grid-cols-[120px_1fr] gap-2 text-sm';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Review & Submit</h2>
        <p className="mt-1 text-sm text-slate-600">
          Review your details — your profile will be sent to our team for approval before going live.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className={sectionCls}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Profile</h3>
        <div className="space-y-1.5">
          <div className={rowCls}>
            <span className="text-slate-500">Name</span>
            <span className="font-medium text-slate-900">{profile?.name}</span>
          </div>
          <div className={rowCls}>
            <span className="text-slate-500">Headline</span>
            <span className="text-slate-800">
              {profile?.headline || <span className="italic text-slate-400">Not set</span>}
            </span>
          </div>
          <div className={rowCls}>
            <span className="text-slate-500">Bio</span>
            <span className="line-clamp-2 text-slate-800">
              {profile?.bio || <span className="italic text-slate-400">Not set</span>}
            </span>
          </div>
          <div className={rowCls}>
            <span className="text-slate-500">Specialties</span>
            <span className="text-slate-800">
              {profile?.specialties?.join(', ') || <span className="italic text-slate-400">None</span>}
            </span>
          </div>
          <div className={rowCls}>
            <span className="text-slate-500">Hourly Rate</span>
            <span className="font-semibold text-amber-700">
              {profile?.hourlyRate ? (
                `$${profile.hourlyRate}`
              ) : (
                <span className="font-normal italic text-slate-400">Not set</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className={sectionCls}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Offers ({offers.length})</h3>
        {offers.length === 0 ? (
          <p className="text-sm italic text-slate-500">No offers added</p>
        ) : (
          <div className="space-y-2">
            {offers.map((offer) => (
              <div key={offer.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-800">{offer.title}</span>
                <span className="text-slate-600">
                  {offer.durationMinutes} min &middot; <span className="text-amber-700">${offer.price}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={sectionCls}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Policies</h3>
        {policy ? (
          <div className="space-y-1.5">
            <div className={rowCls}>
              <span className="text-slate-500">Cancellation</span>
              <span className="text-slate-800">{policy.cancellationHours}h notice</span>
            </div>
            <div className={rowCls}>
              <span className="text-slate-500">Reschedule</span>
              <span className="text-slate-800">{policy.rescheduleHours}h notice</span>
            </div>
            <div className={rowCls}>
              <span className="text-slate-500">No-show</span>
              <span className="text-slate-800">{policy.noShowPolicy}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm italic text-slate-500">Not configured</p>
        )}
      </div>

      <div className={sectionCls}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Availability</h3>
        {profile?.availability?.schedule?.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500">Timezone: {profile.availability.timezone}</p>
            {profile.availability.schedule.map((slot: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-24 font-medium text-brand">{DAYS[slot.dayOfWeek]}</span>
                <span className="text-slate-800">
                  {slot.startTime} – {slot.endTime}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-slate-500">No availability set</p>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <Button
          type="button"
          onClick={handlePublish}
          disabled={loading}
          className="h-12 w-full bg-brand text-base font-semibold text-white shadow-md hover:bg-brand-light"
        >
          {loading ? 'Submitting…' : 'Submit for Approval →'}
        </Button>
        <p className="text-center text-xs text-slate-500">
          Our team will review your profile and notify you once it&apos;s approved and visible to mentees.
        </p>
      </div>
    </div>
  );
}
