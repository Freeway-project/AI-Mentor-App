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
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Browse Mentors</h1>
            <p className="text-slate-600">Find the perfect mentor for your goals</p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-8 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by specialty, skill, or topic..."
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading mentors...</div>
          ) : mentors.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No mentors found. Try a different search.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mentors.map((mentor) => (
                <Link
                  key={mentor.id}
                  href={`/mentors/${mentor.id}`}
                  className="block bg-white rounded-lg border hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg flex-shrink-0">
                      {mentor.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{mentor.name}</h3>
                      {mentor.headline && (
                        <p className="text-sm text-slate-500 truncate">{mentor.headline}</p>
                      )}
                    </div>
                  </div>

                  {mentor.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {mentor.specialties.slice(0, 4).map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 text-sm">
                    <div className="flex items-center gap-3 text-slate-500">
                      {mentor.rating && (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-500">&#9733;</span>
                          {mentor.rating.toFixed(1)}
                        </span>
                      )}
                      {mentor.totalMeetings > 0 && (
                        <span>{mentor.totalMeetings} sessions</span>
                      )}
                    </div>
                    {mentor.hourlyRate && (
                      <span className="font-semibold text-slate-700">
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
    </>
  );
}
