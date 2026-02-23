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
      apiClient.getMyOffers().then(setOffers).catch(() => { }),
      apiClient.getMyPolicies().then(setPolicy).catch(() => { }),
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

  const sectionCls = 'bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3';
  const rowCls = 'grid grid-cols-[120px_1fr] gap-2 text-sm';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Review & Publish</h2>
        <p className="text-sm text-slate-400 mt-1">Review your details before going live on OWLMentors.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Profile summary */}
      <div className={sectionCls}>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile</h3>
        <div className="space-y-1.5">
          <div className={rowCls}>
            <span className="text-slate-500">Name</span>
            <span className="text-white font-medium">{profile?.name}</span>
          </div>
          <div className={rowCls}>
            <span className="text-slate-500">Headline</span>
            <span className="text-slate-300">{profile?.headline || <span className="text-slate-600 italic">Not set</span>}</span>
          </div>
          <div className={rowCls}>
            <span className="text-slate-500">Bio</span>
            <span className="text-slate-300 line-clamp-2">{profile?.bio || <span className="text-slate-600 italic">Not set</span>}</span>
          </div>
          <div className={rowCls}>
            <span className="text-slate-500">Specialties</span>
            <span className="text-slate-300">{profile?.specialties?.join(', ') || <span className="text-slate-600 italic">None</span>}</span>
          </div>
          <div className={rowCls}>
            <span className="text-slate-500">Hourly Rate</span>
            <span className="text-amber-400 font-semibold">{profile?.hourlyRate ? `$${profile.hourlyRate}` : <span className="text-slate-600 italic font-normal">Not set</span>}</span>
          </div>
        </div>
      </div>

      {/* Offers */}
      <div className={sectionCls}>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Offers ({offers.length})</h3>
        {offers.length === 0 ? (
          <p className="text-sm text-slate-600 italic">No offers added</p>
        ) : (
          <div className="space-y-2">
            {offers.map((offer) => (
              <div key={offer.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{offer.title}</span>
                <span className="text-slate-500">{offer.durationMinutes} min &middot; <span className="text-amber-400">${offer.price}</span></span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Policy */}
      <div className={sectionCls}>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Policies</h3>
        {policy ? (
          <div className="space-y-1.5">
            <div className={rowCls}>
              <span className="text-slate-500">Cancellation</span>
              <span className="text-slate-300">{policy.cancellationHours}h notice</span>
            </div>
            <div className={rowCls}>
              <span className="text-slate-500">Reschedule</span>
              <span className="text-slate-300">{policy.rescheduleHours}h notice</span>
            </div>
            <div className={rowCls}>
              <span className="text-slate-500">No-show</span>
              <span className="text-slate-300">{policy.noShowPolicy}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 italic">Not configured</p>
        )}
      </div>

      {/* Availability */}
      <div className={sectionCls}>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Availability</h3>
        {profile?.availability?.schedule?.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500">Timezone: {profile.availability.timezone}</p>
            {profile.availability.schedule.map((slot: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-violet-400 font-medium w-24">{DAYS[slot.dayOfWeek]}</span>
                <span className="text-slate-300">{slot.startTime} – {slot.endTime}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600 italic">No availability set</p>
        )}
      </div>

      {/* Publish CTA */}
      <div className="pt-2">
        <Button
          onClick={handlePublish}
          disabled={loading}
          className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-base shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all"
        >
          {loading ? 'Publishing…' : '🚀 Publish My Profile'}
        </Button>
        <p className="text-xs text-slate-600 text-center mt-3">Your profile will be visible to mentees immediately after publishing.</p>
      </div>
    </div>
  );
}
