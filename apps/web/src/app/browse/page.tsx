
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Upload, FileText, Loader2, CheckCircle2, X, ShieldCheck } from 'lucide-react';
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
import { BrandLoader } from '@/components/brand/brand-loader';
import { frontendLogger } from '@/lib/frontend-logger';
import { motion } from 'framer-motion';
import { Code, PenTool, TrendingUp, MonitorSmartphone } from 'lucide-react';

/** Suggested query chips shown below the search bar */
const SUGGESTED_QUERIES = [
  "I'm weak at TypeScript",
  'Help me with system design',
  'Frontend interview prep',
  'Need React architecture guidance',
  'Machine learning fundamentals',
  'Career growth for senior frontend',
];

const QUICK_CATEGORIES = [
  { label: 'Software Engineering', query: 'Software Engineering', icon: Code, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Product Design', query: 'Product Design UI UX', icon: PenTool, color: 'text-pink-500', bg: 'bg-pink-50' },
  { label: 'Career Growth', query: 'Career Growth Leadership', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { label: 'Frontend & UI', query: 'Frontend React UI', icon: MonitorSmartphone, color: 'text-violet-500', bg: 'bg-violet-50' },
];

type SearchMeta = Pick<MentorSearchResponse, 'hybrid' | 'llmEnhanced' | 'queryAnalysis' | 'semantic'>;

/** Skeleton card shown while loading */
function MentorSkeleton() {
  return (
    <AppPanel className="p-6">
      <div className="flex items-start gap-4 animate-pulse opacity-60">
        <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0" />
        <div className="flex-1 space-y-2.5 mt-1">
          <div className="h-4 bg-slate-200 rounded-md w-1/2" />
          <div className="h-3 bg-slate-100 rounded-md w-3/4" />
        </div>
      </div>
      <div className="flex gap-2 mt-6 animate-pulse opacity-60">
        {[1, 2, 3].map(i => <div key={i} className="h-6 w-16 bg-slate-100 rounded-md" />)}
      </div>
      <div className="flex justify-between mt-6 pt-4 border-t border-slate-100 animate-pulse opacity-60">
        <div className="h-4 w-24 bg-slate-100 rounded-md" />
        <div className="h-4 w-16 bg-slate-100 rounded-md" />
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
      frontendLogger.info('Mentor search started', {
        query: searchQuery || '',
      });
      const data = await apiClient.searchMentors(searchQuery);
      setMentors(data.mentors || []);
      setIsSemantic(!!data.semantic);
      setSearchMeta({
        hybrid: data.hybrid,
        llmEnhanced: data.llmEnhanced,
        queryAnalysis: data.queryAnalysis,
        semantic: data.semantic,
      });
      frontendLogger.info('Mentor search completed', {
        query: searchQuery || '',
        mentors: data.mentors?.length ?? 0,
        semantic: !!data.semantic,
        hybrid: !!data.hybrid,
        llmEnhanced: !!data.llmEnhanced,
      });
    } catch (error) {
      frontendLogger.error('Mentor search failed', {
        query: searchQuery || '',
        error: error instanceof Error ? error.message : String(error),
      });
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
      const params = new URLSearchParams(window.location.search);
      const initialQuery = params.get('query');
      if (initialQuery) {
        setQuery(initialQuery);
      } else {
        fetchMentors();
      }
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
    frontendLogger.info('Resume upload started', {
      name: file.name,
      size: file.size,
      type: file.type,
    });
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
      frontendLogger.info('Resume upload parsed', {
        name: file.name,
        hasExtractedProfile: !!extracted,
      });
    } catch (error) {
      frontendLogger.error('Resume upload failed', {
        name: file.name,
        error: error instanceof Error ? error.message : String(error),
      });
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

          <form onSubmit={handleSearch} className="mx-auto mb-4 flex flex-col sm:flex-row max-w-3xl gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand" />
              <AnimatedPlaceholderInput
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                suggestions={SUGGESTED_QUERIES}
                className={cn(appTheme.input, 'py-3.5 pl-12 pr-4')}
                placeholder="Try: I'm weak at TypeScript"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                type="submit"
                size="lg"
                className="flex-1 sm:flex-none h-[52px] gap-2 rounded-xl bg-brand px-6 text-white shadow-[0_0_20px_rgba(160,120,48,0.22)] hover:bg-brand-light w-full sm:w-auto"
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
                className="h-[52px] gap-2 rounded-xl bg-brand px-5 text-white shadow-[0_0_20px_rgba(160,120,48,0.22)] hover:bg-brand-light disabled:opacity-60 w-full sm:w-auto"
                title="Upload resume to find matching mentors"
              >
                {resumeUploading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Upload className="w-4 h-4" />}
                Resume
              </Button>
            </div>
          </form>

          {/* Resume processing — reuse the mentor search loading scene */}
          {resumeUploading && (
            <div className="flex justify-center py-12">
              <BrandLoader label={resumeStep ?? 'Analysing your resume…'} />
            </div>
          )}

          {/* Resume profile result */}
          {!resumeUploading && resumeProfile && (
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">Resume</span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Analysed
                    </span>
                  </div>
                  <button
                    onClick={() => setResumeProfile(null)}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="px-5 py-4 space-y-3.5">
                  {resumeProfile.headline && (
                    <p className="text-sm font-semibold text-slate-900">{resumeProfile.headline}</p>
                  )}
                  {resumeProfile.summary && (
                    <p className="text-sm text-slate-500 leading-relaxed">{resumeProfile.summary}</p>
                  )}
                  {(resumeProfile.seniorityEstimate || resumeProfile.coreCapabilities?.length > 0 || resumeProfile.tools?.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {resumeProfile.seniorityEstimate && (
                        <Badge variant="outline" className="border-brand/30 bg-brand/10 text-brand text-[11px] font-medium">
                          {resumeProfile.seniorityEstimate}
                        </Badge>
                      )}
                      {resumeProfile.coreCapabilities?.slice(0, 5).map(tag => (
                        <Badge key={tag} variant="outline" className="border-slate-200 bg-slate-100 text-slate-600 text-[11px]">
                          {tag}
                        </Badge>
                      ))}
                      {resumeProfile.tools?.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="border-slate-200 bg-slate-100 text-slate-600 text-[11px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {resumeError && (
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-3.5 flex items-center justify-between">
                <p className="text-sm text-red-600">{resumeError}</p>
                <button onClick={() => setResumeError(null)} className="text-red-400 hover:text-red-600 transition-colors ml-4">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Suggested query chips and Categories */}
          {!isQuerySearch ? (
            <div className="mb-10 max-w-3xl mx-auto space-y-8">
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_QUERIES.map(chip => (
                  <button
                    key={chip}
                    onClick={() => handleChip(chip)}
                    className="rounded-full border border-amber-100 bg-[#fdfaf5] px-4 py-2.5 text-sm text-slate-600 transition-colors hover:border-brand/40 hover:text-brand shadow-sm min-h-[44px]"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 text-center">Explore Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {QUICK_CATEGORIES.map((cat, i) => (
                    <motion.button
                      key={cat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleChip(cat.query)}
                      className="group flex flex-col items-center gap-3 rounded-2xl border border-amber-100/80 bg-[#fdfaf5] p-4 transition-all hover:border-brand/30 hover:shadow-md min-h-[44px]"
                    >
                      <div className={cn('rounded-xl p-3 transition-transform group-hover:scale-110', cat.bg, cat.color)}>
                        <cat.icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-medium text-slate-700 text-center">{cat.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Semantic indicator */}
          {!loading && mentors.length > 0 && (isSemantic || searchMeta.queryAnalysis?.focusTerms?.length) && (
            <div className="mx-auto mb-6 flex max-w-3xl flex-col items-center gap-3 text-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {isSemantic && (
                  <span className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs text-violet-600">
                    <Sparkles className="h-3 w-3" />
                    {searchMeta.hybrid ? 'AI + keyword matched' : 'AI-matched results'}
                  </span>
                )}
                {searchMeta.llmEnhanced && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-600">
                    Ranked with match reasons
                  </span>
                )}
              </div>

              {searchMeta.queryAnalysis?.focusTerms?.length ? (
                <>
                  <p className="max-w-2xl text-sm text-slate-600">
                    We matched this search against{' '}
                    <span className="font-medium text-slate-900">
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
                        className="border-violet-200 bg-violet-50 text-xs text-violet-600"
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
            <div className="space-y-12">
              {isQuerySearch && showSearchScene ? (
                <div className="flex justify-center py-4">
                  <BrandLoader label={`Searching for "${query}"...`} />
                </div>
              ) : null}

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <MentorSkeleton key={i} />)}
              </div>
            </div>
          ) : mentors.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-slate-500">
              <p>No mentors found. Try a different search.</p>
              {searchMeta.queryAnalysis?.focusTerms?.length ? (
                <p className="mt-3 text-sm text-slate-400">
                  Current focus terms: {searchMeta.queryAnalysis.focusTerms.join(', ')}
                </p>
              ) : null}
            </motion.div>
          ) : (
            <motion.div 
              initial="hidden" 
              animate="show" 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {mentors.map(mentor => (
                <motion.div key={mentor.id} variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
                  <Link
                    href={`/mentors/${mentor.id}`}
                    className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-brand/30 hover:shadow-[0_4px_24px_rgba(124,58,237,0.10)]"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/0 to-transparent transition-all duration-300 group-hover:via-brand/40" />

                    <div className="flex items-start gap-4">
                      {mentor.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mentor.avatarUrl}
                          alt={mentor.name}
                          className="h-20 w-20 flex-shrink-0 rounded-full border border-brand/20 object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand/10 text-2xl font-semibold text-brand shadow-sm">
                          {mentor.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="truncate font-semibold text-slate-900 transition-colors group-hover:text-brand">
                              {mentor.name}
                            </h3>
                            {mentor.verified && (
                              <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-500" aria-label="Verified mentor" />
                            )}
                          </div>
                          {mentor.matchScore != null && (
                            <AppStatusBadge tone="brand" className="flex-shrink-0 px-1.5 py-0.5 text-[10px]">
                              {Math.round(mentor.matchScore * 100)}% match
                            </AppStatusBadge>
                          )}
                        </div>
                        {mentor.headline && (
                          <p className="text-sm text-slate-500 truncate mt-0.5">{mentor.headline}</p>
                        )}
                      </div>
                    </div>

                    {mentor.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-5">
                        {mentor.specialties.slice(0, 4).map((s: string) => (
                          <Badge key={s} variant="outline" className="border-slate-200 bg-slate-50 text-xs text-slate-600">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100 text-sm">
                      <div className="flex items-center gap-3 text-slate-500">
                        {mentor.rating && (
                          <span className="flex items-center gap-1 font-medium">
                            <span className="text-amber-400">&#9733;</span>
                            <span className="text-slate-700">{mentor.rating.toFixed(1)}</span>
                          </span>
                        )}
                        {mentor.totalMeetings > 0 && (
                          <span>{mentor.totalMeetings} sessions</span>
                        )}
                      </div>
                      {mentor.hourlyRate && (
                        <span className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 font-semibold text-amber-700">
                          ${mentor.hourlyRate}/hr
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </AppPageShell>
  );
}
