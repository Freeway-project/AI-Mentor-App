
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { apiClient, MentorSearchResponse, CareerExtractedProfile } from '@/lib/api-client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AppPageHeader,
  AppPageShell,
  AppPanel,
  AppStatusBadge,
  appTheme,
} from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';
import { AnimatedPlaceholderInput } from '@/components/ui/animated-placeholder-input';
import { SearchLoadingScene } from '@/components/browse/search-loading-scene';

/** Suggested query chips shown below the search bar */
const SUGGESTED_QUERIES = [
  "I'm weak at TypeScript",
  'Help me with system design',
  'Frontend interview prep',
  'Need React architecture guidance',
  'Machine learning fundamentals',
  'Career growth for senior frontend',
];

type SearchMeta = Pick<MentorSearchResponse, 'hybrid' | 'llmEnhanced' | 'queryAnalysis' | 'semantic'>;

/** Skeleton card shown while loading */
function MentorSkeleton() {
  return (
    <AppPanel className="animate-pulse p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-800 rounded w-32" />
          <div className="h-3 bg-slate-800 rounded w-48" />
        </div>
      </div>
      <div className="flex gap-1.5 mt-5">
        {[1, 2, 3].map(i => <div key={i} className="h-5 w-16 bg-slate-800 rounded-full" />)}
      </div>
      <div className="flex justify-between mt-6 pt-4 border-t border-slate-800/70">
        <div className="h-4 w-20 bg-slate-800 rounded" />
        <div className="h-4 w-16 bg-slate-800 rounded" />
      </div>
    </AppPanel>
  );
}

export default function BrowsePage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSearchScene, setShowSearchScene] = useState(false);
  const [isSemantic, setIsSemantic] = useState(false);
  const [searchMeta, setSearchMeta] = useState<SearchMeta>({});
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeStep, setResumeStep] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeProfile, setResumeProfile] = useState<CareerExtractedProfile | null>(null);
  const hasLoadedInitialResults = useRef(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const fetchMentors = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const data = await apiClient.searchMentors(searchQuery);
      setMentors(data.mentors || []);
      setIsSemantic(!!data.semantic);
      setSearchMeta({
        hybrid: data.hybrid,
        llmEnhanced: data.llmEnhanced,
        queryAnalysis: data.queryAnalysis,
        semantic: data.semantic,
      });
    } catch {
      setMentors([]);
      setIsSemantic(false);
      setSearchMeta({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasLoadedInitialResults.current) {
      hasLoadedInitialResults.current = true;
      fetchMentors();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      fetchMentors(query.trim() || undefined);
    }, 320);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (!loading) {
      setShowSearchScene(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSearchScene(true);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [loading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMentors(query);
  };

  const handleChip = (chip: string) => {
    setQuery(chip);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    setResumeError(null);
    setResumeProfile(null);
    setResumeStep('Parsing your resume…');
    try {
      const result = await apiClient.parseResume(file);
      setResumeStep('Building your profile…');
      const extracted = result.extractedProfile;
      if (extracted) {
        setResumeProfile(extracted);
        const caps = extracted.coreCapabilities?.slice(0, 3) ?? [];
        const tools = extracted.tools?.slice(0, 2) ?? [];
        const skills = [...caps, ...tools].filter(Boolean).join(', ');
        const headline = extracted.headline ?? extracted.seniorityEstimate ?? '';
        const autoQuery = headline ? `${headline} ${skills}`.trim() : skills;
        if (autoQuery) setQuery(autoQuery);
      }
    } catch {
      setResumeError('Resume upload failed. Please try again.');
    } finally {
      setResumeUploading(false);
      setResumeStep(null);
      e.target.value = '';
    }
  };

  const isQuerySearch = query.trim().length > 0;

  return (
    <AppPageShell>
      <Navbar />

      <div className={cn(appTheme.content, 'flex-1 py-8 pb-16')}>
        <div className={cn(appTheme.container, 'space-y-10')}>
          <AppPageHeader
            align="center"
            title="Find Your Mentor"
            description="Describe what you want to learn and the same shared search surface will match you with the right mentor."
            descriptionClassName="lg:max-w-none lg:whitespace-nowrap"
            className="mb-2"
          />

          <form onSubmit={handleSearch} className="mx-auto mb-4 flex max-w-3xl gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-brand-lighter" />
              <AnimatedPlaceholderInput
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                suggestions={SUGGESTED_QUERIES}
                className={cn(appTheme.input, 'py-3.5 pl-12 pr-4')}
                placeholder="Try: I'm weak at TypeScript"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-[52px] gap-2 rounded-xl bg-brand px-6 text-white shadow-[0_0_20px_rgba(124,58,237,0.22)] hover:bg-brand-light"
            >
              {query.length > 3 ? <Sparkles className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleResumeUpload}
            />
            <Button
              type="button"
              size="lg"
              disabled={resumeUploading}
              onClick={() => resumeInputRef.current?.click()}
              className="h-[52px] gap-2 rounded-xl bg-brand px-5 text-white shadow-[0_0_20px_rgba(124,58,237,0.22)] hover:bg-brand-light disabled:opacity-60"
              title="Upload resume to find matching mentors"
            >
              {resumeUploading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Upload className="w-4 h-4" />}
              Resume
            </Button>
          </form>

          {/* Resume processing indicator */}
          {resumeUploading && resumeStep && (
            <div className="mx-auto max-w-3xl -mt-2">
              <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-brand-lighter flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm font-medium text-brand-lighter">{resumeStep}</p>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-brand/10">
                    <div className="h-full w-1/2 rounded-full bg-brand/50 animate-[pulse_1.2s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resume profile summary */}
          {!resumeUploading && resumeProfile && (
            <div className="mx-auto max-w-3xl -mt-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3.5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-300">
                      Resume analysed
                      {resumeProfile.headline && (
                        <span className="text-white"> · {resumeProfile.headline}</span>
                      )}
                    </p>
                    {resumeProfile.summary && (
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{resumeProfile.summary}</p>
                    )}
                  </div>
                  <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                </div>
                {(resumeProfile.coreCapabilities?.length > 0 || resumeProfile.tools?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[...resumeProfile.coreCapabilities.slice(0, 4), ...resumeProfile.tools.slice(0, 3)].map(tag => (
                      <span
                        key={tag}
                        className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {resumeProfile.seniorityEstimate && (
                      <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-300">
                        {resumeProfile.seniorityEstimate}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {resumeError && (
            <p className="mx-auto max-w-3xl text-center text-xs text-red-400 -mt-2">{resumeError}</p>
          )}

          {/* Suggested query chips */}
          {!isQuerySearch ? (
            <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
              {SUGGESTED_QUERIES.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleChip(chip)}
                  className="rounded-full border border-white/10 bg-slate-900/35 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-brand/40 hover:text-white"
                >
                  {chip}
                </button>
              ))}
            </div>
          ) : null}

          {/* Semantic indicator */}
          {!loading && mentors.length > 0 && (isSemantic || searchMeta.queryAnalysis?.focusTerms?.length) && (
            <div className="mx-auto mb-6 flex max-w-3xl flex-col items-center gap-3 text-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {isSemantic && (
                  <span className="flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-400">
                    <Sparkles className="h-3 w-3" />
                    {searchMeta.hybrid ? 'AI + keyword matched' : 'AI-matched results'}
                  </span>
                )}
                {searchMeta.llmEnhanced && (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
                    Ranked with match reasons
                  </span>
                )}
              </div>

              {searchMeta.queryAnalysis?.focusTerms?.length ? (
                <>
                  <p className="max-w-2xl text-sm text-slate-300">
                    We matched this search against{' '}
                    <span className="font-medium text-white">
                      {searchMeta.queryAnalysis.focusTerms.join(', ')}
                    </span>
                    {searchMeta.queryAnalysis.experienceLevel && (
                      <> for a {searchMeta.queryAnalysis.experienceLevel} learner</>
                    )}
                    .
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {searchMeta.queryAnalysis.focusTerms.map(term => (
                      <Badge
                        key={term}
                        variant="outline"
                        className="border-violet-500/20 bg-violet-500/10 text-xs text-violet-300"
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="space-y-8">
              {isQuerySearch && showSearchScene ? (
                <SearchLoadingScene query={query} />
              ) : null}

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <MentorSkeleton key={i} />)}
              </div>
            </div>
          ) : mentors.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <p>No mentors found. Try a different search.</p>
              {searchMeta.queryAnalysis?.focusTerms?.length ? (
                <p className="mt-3 text-sm text-slate-500">
                  Current focus terms: {searchMeta.queryAnalysis.focusTerms.join(', ')}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mentors.map(mentor => (
                <Link
                  key={mentor.id}
                  href={`/mentors/${mentor.id}`}
                  className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md transition-all duration-300 hover:border-brand/30 hover:bg-slate-900/70 hover:shadow-[0_0_30px_rgba(124,58,237,0.08)]"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/0 to-transparent transition-all duration-300 group-hover:via-brand/50" />

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand/10 text-lg font-semibold text-brand-lighter shadow-inner">
                      {mentor.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-semibold text-white transition-colors group-hover:text-brand-lighter">
                          {mentor.name}
                        </h3>
                        {/* Match score badge — only shown for semantic results */}
                        {mentor.matchScore != null && (
                          <AppStatusBadge tone="brand" className="flex-shrink-0 px-1.5 py-0.5 text-[10px]">
                            {Math.round(mentor.matchScore * 100)}% match
                          </AppStatusBadge>
                        )}
                      </div>
                      {mentor.headline && (
                        <p className="text-sm text-slate-400 truncate mt-0.5">{mentor.headline}</p>
                      )}
                    </div>
                  </div>

                  {mentor.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-5">
                      {mentor.specialties.slice(0, 4).map((s: string) => (
                        <Badge key={s} variant="outline" className="border-white/10 bg-slate-800/70 text-xs text-slate-300">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {mentor.matchReason && (
                    <p className="mt-4 rounded-xl border border-violet-500/10 bg-violet-500/5 px-3.5 py-3 text-sm leading-6 text-slate-300">
                      {mentor.matchReason}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/70 text-sm">
                    <div className="flex items-center gap-3 text-slate-400">
                      {mentor.rating && (
                        <span className="flex items-center gap-1 font-medium">
                          <span className="text-amber-400">&#9733;</span>
                          <span className="text-slate-300">{mentor.rating.toFixed(1)}</span>
                        </span>
                      )}
                      {mentor.totalMeetings > 0 && (
                        <span>{mentor.totalMeetings} sessions</span>
                      )}
                    </div>
                    {mentor.hourlyRate && (
                      <span className="rounded-md bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-300">
                        ${mentor.hourlyRate}/hr
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppPageShell>
  );
}
