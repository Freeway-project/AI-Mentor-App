'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ExpertiseStepProps {
  profile: any;
  onComplete: () => void;
}

export function ExpertiseStep({ profile, onComplete }: ExpertiseStepProps) {
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
        specialties: specialties.split(',').map((s: string) => s.trim()).filter(Boolean),
        expertise: expertise.split(',').map((s: string) => s.trim()).filter(Boolean),
        languages: languages.split(',').map((s: string) => s.trim()).filter(Boolean),
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      });
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Your expertise</h2>
        <p className="text-sm text-slate-400 mt-1">Help mentees find you based on what you know and teach.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          {error}
          <button type="button" onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div>
        <label className={labelCls}>Specialties <span className="normal-case font-normal text-slate-600">(comma-separated)</span></label>
        <input
          type="text"
          value={specialties}
          onChange={e => setSpecialties(e.target.value)}
          className={inputCls}
          placeholder="e.g. React, TypeScript, System Design"
        />
        <p className={hintCls}>Topics you specialize in — used to match you with mentees</p>
      </div>

      <div>
        <label className={labelCls}>Expertise areas <span className="normal-case font-normal text-slate-600">(comma-separated)</span></label>
        <input
          type="text"
          value={expertise}
          onChange={e => setExpertise(e.target.value)}
          className={inputCls}
          placeholder="e.g. Frontend, Full-stack, Cloud Architecture"
        />
        <p className={hintCls}>Broader domains of experience</p>
      </div>

      <div>
        <label className={labelCls}>Languages <span className="normal-case font-normal text-slate-600">(comma-separated)</span></label>
        <input
          type="text"
          value={languages}
          onChange={e => setLanguages(e.target.value)}
          className={inputCls}
          placeholder="e.g. English, Spanish"
        />
      </div>

      <div>
        <label className={labelCls}>Hourly Rate (USD)</label>
        <input
          type="number"
          min="0"
          value={hourlyRate}
          onChange={e => setHourlyRate(e.target.value)}
          className={inputCls}
          placeholder="e.g. 75"
        />
        <p className={hintCls}>Leave blank if you prefer to negotiate per session</p>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand text-white">
        {loading ? 'Saving…' : 'Save & Continue →'}
      </Button>
    </form>
  );
}
