'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BrowsePage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMentors = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const data = await apiClient.searchMentors(searchQuery);
      setMentors(data.mentors || []);
    } catch {
      setMentors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMentors(query);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}>
      {/* Deep space base */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute top-10 right-10 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>

      <Navbar />
      <div className="flex-1 relative z-10 w-full pt-8 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Browse Mentors</h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Find the perfect mentor to illuminate your path</p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-12 flex gap-3 max-w-3xl mx-auto">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-slate-700/50 bg-slate-900/50 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder:text-slate-500 transition-all shadow-inner"
                placeholder="Search by specialty, skill, or topic..."
              />
            </div>
            <Button type="submit" size="lg" className="h-[52px] px-8 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.2)]">Search</Button>
          </form>

          {/* Results */}
          {loading ? (
            <div className="text-center py-20 text-slate-400">Loading mentors...</div>
          ) : mentors.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              No mentors found. Try a different search.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mentors.map((mentor) => (
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
                      <h3 className="font-semibold text-white truncate group-hover:text-violet-300 transition-colors">{mentor.name}</h3>
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
