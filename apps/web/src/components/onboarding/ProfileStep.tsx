'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

interface ProfileStepProps {
  profile: any;
  onComplete: () => void;
}

export function ProfileStep({ profile, onComplete }: ProfileStepProps) {
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [specialties, setSpecialties] = useState(profile?.specialties?.join(', ') || '');
  const [expertise, setExpertise] = useState(profile?.expertise?.join(', ') || '');
  const [languages, setLanguages] = useState(profile?.languages?.join(', ') || 'English');
  const [hourlyRate, setHourlyRate] = useState(profile?.hourlyRate?.toString() || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.updateMyMentorProfile({
        headline,
        bio,
        specialties: specialties.split(',').map((s: string) => s.trim()).filter(Boolean),
        expertise: expertise.split(',').map((s: string) => s.trim()).filter(Boolean),
        languages: languages.split(',').map((s: string) => s.trim()).filter(Boolean),
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Your Profile</h2>
      <p className="text-sm text-slate-500">Tell mentees about yourself and your expertise.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Senior React Developer & Mentor"
          maxLength={200}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Share your background, experience, and what you can help with..."
          maxLength={1000}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Specialties (comma-separated)</label>
        <input
          type="text"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. React, TypeScript, System Design"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Expertise (comma-separated)</label>
        <input
          type="text"
          value={expertise}
          onChange={(e) => setExpertise(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Frontend, Full-stack, Cloud Architecture"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Languages (comma-separated)</label>
        <input
          type="text"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. English, Spanish"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate (USD)</label>
        <input
          type="number"
          min="0"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 50"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save & Continue'}
      </Button>
    </form>
  );
}
