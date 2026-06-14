'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppPageHeader,
  AppPanel,
  AppSectionLabel,
  AppStatusBadge,
  appTheme,
} from '@/components/ui/app-theme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient, CareerGoalInput, CareerProfile } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Briefcase, Brain, FileUp, GraduationCap, Sparkles, Target } from 'lucide-react';

const ROLE_SUGGESTIONS = [
  'Frontend Engineer',
  'Backend Engineer',
  'Full-Stack Engineer',
  'ML / AI Engineer',
  'Engineering Manager',
  'Product Manager',
  'UX / Product Designer',
  'Data Analyst',
];

const FOCUS_SUGGESTIONS = [
  'System Design',
  'TypeScript',
  'React Architecture',
  'Node.js / APIs',
  'Databases',
  'Cloud / DevOps',
  'Machine Learning',
  'Interview Prep',
  'Stakeholder Communication',
  'Leadership Growth',
  'Portfolio Positioning',
  'Domain Expertise',
];

const TIMELINE_OPTIONS = [1, 3, 6, 12];

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
}

export default function MenteeCareerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [focusAreaInput, setFocusAreaInput] = useState('');
  const [goalForm, setGoalForm] = useState<CareerGoalInput>({
    targetRole: '',
    careerStageGoal: '',
    freeformGoal: '',
    preferredLanguage: '',
  });

  const loadProfile = useCallback(async () => {
    try {
      const data = await apiClient.getCareerProfile();
      setProfile(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load career profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/mentee/career');
      return;
    }
    loadProfile();
  }, [authLoading, user, router, loadProfile]);

  const focusAreas = useMemo(
    () =>
      focusAreaInput
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
    [focusAreaInput]
  );

  const handleUpload = async () => {
    if (!resumeFile) {
      toast.error('Choose a resume file first');
      return;
    }

    setUploading(true);
    try {
      const data = await apiClient.uploadCareerResume(resumeFile);
      setProfile(data);
      toast.success('Resume uploaded and parsed');
      setResumeFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!profile?.extractedProfile) {
      toast.error('Upload a resume before running analysis');
      return;
    }

    setAnalyzing(true);
    try {
      const data = await apiClient.analyzeCareerProfile({
        ...goalForm,
        focusAreas,
        targetRole: goalForm.targetRole?.trim() || undefined,
        careerStageGoal: goalForm.careerStageGoal?.trim() || undefined,
        freeformGoal: goalForm.freeformGoal?.trim() || undefined,
        preferredLanguage: goalForm.preferredLanguage?.trim() || undefined,
      });
      setProfile(data);
      toast.success('Career analysis updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze career profile');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 md:px-8">
        <p className="text-sm text-slate-500 animate-pulse">Loading career analysis…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-8 px-4 py-6 sm:px-6 md:py-8 md:px-8">
      <AppPageHeader
        title="Career Analysis"
        description="Upload your resume, define a target role or growth goal, and turn that into a broader development plan across skills, domain depth, communication, leadership, and mentor recommendations."
      />

      <div className="grid min-w-0 gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <AppPanel className="min-w-0 space-y-5 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-brand/20 bg-brand/10 p-2.5 text-brand">
              <FileUp className="h-5 w-5 shrink-0" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Resume Upload</h2>
              <p className="text-sm text-slate-500">Uses Google Document AI for PDF, DOCX, HTML, and common image resume formats.</p>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-700">Resume file</span>
            <input
              type="file"
              accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/html,image/jpeg,image/png,image/webp,image/gif,image/tiff,image/bmp"
              onChange={event => setResumeFile(event.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleUpload} disabled={uploading || !resumeFile}>
              {uploading ? 'Uploading…' : 'Upload Resume'}
            </Button>
            {profile?.resume ? (
              <p className="text-sm text-slate-500">
                Latest resume: <span className="text-slate-700">{profile.resume.fileName}</span> · uploaded {formatDate(profile.resume.uploadedAt)}
              </p>
            ) : null}
          </div>

          {profile?.errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {profile.errorMessage}
            </div>
          ) : null}
        </AppPanel>

        <AppPanel className="min-w-0 space-y-5 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-2.5 text-purple-600">
              <Target className="h-5 w-5 shrink-0" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">Optional Goal Form</h2>
              <p className="text-sm text-slate-500">Use it to anchor the analysis around a role target, growth path, exploratory interests, and constraints.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="min-w-0">
              <p className="mb-2 text-sm text-slate-700">Role targeting</p>
              <div className="flex flex-wrap gap-2">
                {ROLE_SUGGESTIONS.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setGoalForm(current => ({ ...current, targetRole: role }))}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition-colors',
                      goalForm.targetRole === role
                        ? 'border-brand/40 bg-brand/10 text-brand'
                        : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-brand/30 hover:text-brand'
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-2 block text-sm text-slate-700">Target role</label>
                <input
                  value={goalForm.targetRole ?? ''}
                  onChange={event => setGoalForm(current => ({ ...current, targetRole: event.target.value }))}
                  className={appTheme.input}
                  placeholder="e.g. Backend Engineer"
                />
              </div>
              <div className="min-w-0">
                <label className="mb-2 block text-sm text-slate-700">Career stage goal</label>
                <input
                  value={goalForm.careerStageGoal ?? ''}
                  onChange={event => setGoalForm(current => ({ ...current, careerStageGoal: event.target.value }))}
                  className={appTheme.input}
                  placeholder="e.g. Career transition"
                />
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-2 text-sm text-slate-700">Suggested focus areas</p>
              <div className="flex flex-wrap gap-2">
                {FOCUS_SUGGESTIONS.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => {
                      const next = new Set(focusAreas);
                      next.has(area) ? next.delete(area) : next.add(area);
                      setFocusAreaInput(Array.from(next).join(', '));
                    }}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition-colors',
                      focusAreas.includes(area)
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
                        : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-emerald-500/30 hover:text-emerald-700'
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-700">Focus areas</label>
              <input
                value={focusAreaInput}
                onChange={event => setFocusAreaInput(event.target.value)}
                className={appTheme.input}
                placeholder="Comma-separated, e.g. System Design, Stakeholder Communication, Domain Expertise"
              />
            </div>

            <div>
              <p className="mb-2 text-sm text-slate-700">Timeline</p>
              <div className="flex flex-wrap gap-2">
                {TIMELINE_OPTIONS.map(months => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setGoalForm(current => ({ ...current, timelineMonths: months }))}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition-colors',
                      goalForm.timelineMonths === months
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-700'
                        : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-amber-500/30 hover:text-amber-700'
                    )}
                  >
                    {months} month{months > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0">
                <label className="mb-2 block text-sm text-slate-700">Weekly hours</label>
                <input
                  type="number"
                  min="1"
                  max="80"
                  value={goalForm.weeklyHours ?? ''}
                  onChange={event => setGoalForm(current => ({ ...current, weeklyHours: Number(event.target.value) || undefined }))}
                  className={appTheme.input}
                  placeholder="5"
                />
              </div>
              <div className="min-w-0">
                <label className="mb-2 block text-sm text-slate-700">Mentor budget</label>
                <input
                  type="number"
                  min="1"
                  value={goalForm.maxBudget ?? ''}
                  onChange={event => setGoalForm(current => ({ ...current, maxBudget: Number(event.target.value) || undefined }))}
                  className={appTheme.input}
                  placeholder="100"
                />
              </div>
              <div className="min-w-0">
                <label className="mb-2 block text-sm text-slate-700">Preferred language</label>
                <input
                  value={goalForm.preferredLanguage ?? ''}
                  onChange={event => setGoalForm(current => ({ ...current, preferredLanguage: event.target.value }))}
                  className={appTheme.input}
                  placeholder="English"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-700">Freeform goal</label>
              <textarea
                value={goalForm.freeformGoal ?? ''}
                onChange={event => setGoalForm(current => ({ ...current, freeformGoal: event.target.value }))}
                className={cn(appTheme.input, 'min-h-28 resize-y')}
                placeholder="e.g. I want to grow into product leadership, improve stakeholder communication, and explore fintech while finding mentors who can help me expand."
              />
            </div>

            <Button onClick={handleAnalyze} disabled={analyzing || !profile?.extractedProfile}>
              {analyzing ? 'Analyzing…' : 'Analyze Career Profile'}
            </Button>
          </div>
        </AppPanel>
      </div>

      {profile?.extractedProfile ? (
        <div className="grid min-w-0 gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
          <AppPanel className="min-w-0 space-y-5 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-brand/20 bg-brand/10 p-2.5 text-brand">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Career Snapshot</h2>
                <p className="text-sm text-slate-500">Structured profile extracted from the latest resume.</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <p>{profile.extractedProfile.summary}</p>
              <div className="flex flex-wrap items-center gap-2">
                <AppStatusBadge tone="brand">{profile.extractedProfile.seniorityEstimate}</AppStatusBadge>
                <AppStatusBadge tone="slate">
                  {Math.round((profile.extractedProfile.confidence ?? 0) * 100)}% extraction confidence
                </AppStatusBadge>
              </div>
            </div>

            {profile.extractedProfile.coreCapabilities.length > 0 ? (
              <div>
                <AppSectionLabel className="mb-3">Core Capabilities</AppSectionLabel>
                <div className="flex flex-wrap gap-2">
                  {profile.extractedProfile.coreCapabilities.slice(0, 14).map(skill => (
                    <Badge key={skill} variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {profile.extractedProfile.functionalSkills.length > 0 ? (
                <div>
                  <AppSectionLabel className="mb-3">Functional Skills</AppSectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {profile.extractedProfile.functionalSkills.slice(0, 8).map(item => (
                      <Badge key={item} variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {profile.extractedProfile.communicationSkills.length > 0 ? (
                <div>
                  <AppSectionLabel className="mb-3">Communication</AppSectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {profile.extractedProfile.communicationSkills.slice(0, 8).map(item => (
                      <Badge key={item} variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {profile.extractedProfile.leadershipSignals.length > 0 ? (
                <div>
                  <AppSectionLabel className="mb-3">Leadership Signals</AppSectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {profile.extractedProfile.leadershipSignals.slice(0, 8).map(item => (
                      <Badge key={item} variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {profile.extractedProfile.careerInterests.length > 0 ? (
                <div>
                  <AppSectionLabel className="mb-3">Potential Interests</AppSectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {profile.extractedProfile.careerInterests.slice(0, 8).map(item => (
                      <Badge key={item} variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {profile.extractedProfile.experienceTimeline.length > 0 ? (
              <div>
                <AppSectionLabel className="mb-3">Experience Timeline</AppSectionLabel>
                <div className="space-y-3">
                  {profile.extractedProfile.experienceTimeline.slice(0, 4).map(item => (
                    <div key={`${item.title}-${item.company}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {[item.company, item.startDate, item.endDate].filter(Boolean).join(' · ')}
                      </p>
                      {item.summary ? <p className="mt-2 text-sm text-slate-600">{item.summary}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </AppPanel>

          <div className="min-w-0 space-y-6">
            {profile.goalProfile ? (
              <AppPanel className="min-w-0 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-amber-600">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">Normalized Goal</h2>
                    <p className="text-sm text-slate-500">{profile.goalProfile.goalSummary}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <AppStatusBadge tone="amber">{profile.goalProfile.targetRole}</AppStatusBadge>
                  <AppStatusBadge tone="slate">{profile.goalProfile.goalType.replace('_', ' ')}</AppStatusBadge>
                  {profile.goalProfile.timelineMonths ? (
                    <AppStatusBadge tone="purple">{profile.goalProfile.timelineMonths} month horizon</AppStatusBadge>
                  ) : null}
                </div>
              </AppPanel>
            ) : null}

            {profile.latestAnalysis ? (
              <AppPanel className="min-w-0 space-y-5 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-2.5 text-purple-600">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">Analysis Summary</h2>
                    <p className="text-sm text-slate-500">{profile.latestAnalysis.currentLevelSummary}</p>
                  </div>
                </div>

                <div className="grid min-w-0 gap-4 lg:grid-cols-3">
                  <div className="min-w-0">
                    <AppSectionLabel className="mb-3">Strengths</AppSectionLabel>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {profile.latestAnalysis.topStrengths.map(item => (
                        <li key={item} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="min-w-0">
                    <AppSectionLabel className="mb-3">Gaps</AppSectionLabel>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {profile.latestAnalysis.primaryGaps.map(item => (
                        <li key={item} className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="min-w-0">
                    <AppSectionLabel className="mb-3">Recommended Focus Areas</AppSectionLabel>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {profile.latestAnalysis.recommendedFocusAreas.map(item => (
                        <li key={item} className="rounded-xl border border-brand/20 bg-brand/5 px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <AppSectionLabel className="mb-3">Brief Plan</AppSectionLabel>
                  <p className="text-sm leading-6 text-slate-600">{profile.latestAnalysis.briefPlan}</p>
                </div>

                {profile.latestAnalysis.recommendedCourses?.length > 0 ? (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                    <AppSectionLabel className="mb-3">Recommended Courses</AppSectionLabel>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {profile.latestAnalysis.recommendedCourses.map(item => (
                        <li
                          key={item}
                          className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {profile.latestAnalysis.recommendedCertifications?.length > 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                    <AppSectionLabel className="mb-3">Certifications Worth Pursuing</AppSectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {profile.latestAnalysis.recommendedCertifications.map(item => (
                        <Badge
                          key={item}
                          variant="outline"
                          className="border-amber-300 bg-amber-100 text-amber-900"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {profile.latestAnalysis.explorationSuggestions.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <AppSectionLabel className="mb-3">Explore Further</AppSectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {profile.latestAnalysis.explorationSuggestions.map(item => (
                        <Badge key={item} variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </AppPanel>
            ) : (
              <AppPanel className="min-w-0 p-5">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 shrink-0 text-brand" />
                  <p className="text-sm text-slate-600">
                    Resume extraction is ready. Run analysis to generate strengths, broader development areas, and mentor recommendations.
                  </p>
                </div>
              </AppPanel>
            )}

            {profile.mentorRecommendations.length > 0 ? (
              <AppPanel className="min-w-0 space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-brand/20 bg-brand/10 p-2.5 text-brand">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">Suggested Mentors</h2>
                    <p className="text-sm text-slate-500">Generated from your current profile, goal, and recommended learning areas.</p>
                  </div>
                </div>

                <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {profile.mentorRecommendations.map(mentor => (
                    <Link
                      key={mentor.mentorId}
                      href={`/mentors/${mentor.mentorId}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand/40 hover:shadow-[0_4px_20px_rgba(124,58,237,0.08)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{mentor.name}</h3>
                          {mentor.headline ? <p className="mt-1 text-sm text-slate-500">{mentor.headline}</p> : null}
                        </div>
                        {mentor.matchScore != null ? (
                          <AppStatusBadge tone="brand">{Math.round(mentor.matchScore * 100)}% match</AppStatusBadge>
                        ) : null}
                      </div>
                      {mentor.matchReason ? (
                        <p className="mt-4 text-sm leading-6 text-slate-600">{mentor.matchReason}</p>
                      ) : null}
                      {mentor.specialties.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {mentor.specialties.slice(0, 4).map(skill => (
                            <Badge key={skill} variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {mentor.hourlyRate ? (
                        <p className="mt-4 text-sm font-medium text-amber-600">${mentor.hourlyRate}/hr</p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </AppPanel>
            ) : null}
          </div>
        </div>
      ) : (
        <AppPanel className="min-w-0 p-6">
          <p className="text-sm text-slate-500">
            Upload a resume to generate a career snapshot and tailored mentor suggestions.
          </p>
        </AppPanel>
      )}
    </div>
  );
}
