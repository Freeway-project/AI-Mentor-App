'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { SkillTokenInput } from '@/components/onboarding/SkillTokenInput';
import { LanguageMultiSelect } from '@/components/onboarding/LanguageMultiSelect';
import { SKILL_SUGGESTIONS } from '@/data/skill-suggestions';
import { appTheme } from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';

interface ExpertiseStepProps {
  profile: any;
  onComplete: () => void;
}

export function ExpertiseStep({ profile, onComplete }: ExpertiseStepProps) {
  const [specialties, setSpecialties] = useState<string[]>(profile?.specialties?.length ? profile.specialties : []);
  const [expertise, setExpertise] = useState<string[]>(profile?.expertise?.length ? profile.expertise : []);
  const [languages, setLanguages] = useState<string[]>(
    profile?.languages?.length ? profile.languages : ['English']
  );
  const [hourlyRate, setHourlyRate] = useState(profile?.hourlyRate?.toString() || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.updateMyMentorProfile({
        specialties,
        expertise,
        languages: languages.length ? languages : ['English'],
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      });
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Your expertise</h2>
        <p className="mt-1 text-sm text-slate-600">Help mentees find you based on what you know and teach.</p>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => setError('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <SkillTokenInput
        label={
          <span className={labelCls}>
            Specialties <span className="normal-case font-normal text-slate-500">(add tags)</span>
          </span>
        }
        hint="Topics you specialize in — type to see suggestions, Enter to add"
        tokens={specialties}
        onChange={setSpecialties}
        suggestions={SKILL_SUGGESTIONS}
        placeholder="e.g. React, TypeScript…"
      />

      <SkillTokenInput
        label={
          <span className={labelCls}>
            Expertise areas <span className="normal-case font-normal text-slate-500">(add tags)</span>
          </span>
        }
        hint="Broader domains — same suggestions as specialties"
        tokens={expertise}
        onChange={setExpertise}
        suggestions={SKILL_SUGGESTIONS}
        placeholder="e.g. Frontend, Cloud…"
      />

      <LanguageMultiSelect selected={languages} onChange={setLanguages} />

      <div>
        <label className={labelCls}>Hourly Rate (USD)</label>
        <input
          type="number"
          min="0"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          className={inputCls}
          placeholder="e.g. 75"
        />
        <p className={hintCls}>Leave blank if you prefer to negotiate per session</p>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-brand text-white hover:bg-brand-light">
        {loading ? 'Saving…' : 'Save & Continue →'}
      </Button>
    </form>
  );
}
