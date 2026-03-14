'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/** Suggested query chips shown below the search bar */
const SUGGESTED_QUERIES = [
  'React & TypeScript',
  'System Design',
  'Interview Prep',
  'Machine Learning',
  'Career Growth',
  'Backend Engineering',
];

/** Skeleton card shown while loading */
function MentorSkeleton() {
  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6 animate-pulse">
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
    </div>
  );
}

export default function BrowsePage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSemantic, setIsSemantic] = useState(false);

  const fetchMentors = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const data = await apiClient.searchMentors(searchQuery);
      setMentors(data.mentors || []);
      setIsSemantic(!!(data as any).semantic);
    } catch {
      setMentors([]);
      setIsSemantic(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMentors(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMentors(query);
  };

  const handleChip = (chip: string) => {
    setQuery(chip);
    fetchMentors(chip);
  };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute top-10 right-10 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>

      <Navbar />

      <div className="flex-1 relative z-10 w-full pt-8 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Find Your Mentor</h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Describe what you want to learn — our AI matches you with the right mentor
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-4 flex gap-3 max-w-3xl mx-auto">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-slate-700/50 bg-slate-900/50 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder:text-slate-500 transition-all shadow-inner"
                placeholder="Try: 'I want to learn system design' or 'I'm weak at TypeScript'"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-[52px] px-6 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.2)] flex items-center gap-2"
            >
              {query.length > 3 ? <Sparkles className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
          </form>

          {/* Suggested query chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
            {SUGGESTED_QUERIES.map(chip => (
              <button
                key={chip}
                onClick={() => handleChip(chip)}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:border-violet-500 hover:text-violet-400 transition-colors bg-slate-900/30"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Semantic indicator */}
          {isSemantic && !loading && mentors.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="flex items-center gap-1.5 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full">
                <Sparkles className="w-3 h-3" /> AI-matched results for &ldquo;{query}&rdquo;
              </span>
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <MentorSkeleton key={i} />)}
            </div>
          ) : mentors.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              No mentors found. Try a different search.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mentors.map(mentor => (
                <Link
                  key={mentor.id}
                  href={`/mentors/${mentor.id}`}
                  className="group block bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 hover:border-violet-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.08)] transition-all duration-300 p-6 relative overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/0 to-transparent group-hover:via-violet-500/50 transition-all duration-300" />

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-semibold text-lg flex-shrink-0 shadow-inner">
                      {mentor.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                          {mentor.name}
                        </h3>
                        {/* Match score badge — only shown for semantic results */}
                        {mentor.matchScore != null && (
                          <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            {Math.round(mentor.matchScore * 100)}% match
                          </span>
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
                        <Badge key={s} variant="outline" className="text-xs bg-slate-800/50 text-slate-300 border-slate-700/50">
                          {s}
                        </Badge>
                      ))}
                    </div>
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
                      <span className="font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md">
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
    </div>
  );
}
