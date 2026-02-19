'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MentorProfilePage() {
  const params = useParams();
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = params.id as string;
    apiClient.getMentor(id)
      .then(setMentor)
      .catch((err) => setError(err.message || 'Mentor not found'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-500">Loading...</p>
        </div>
      </>
    );
  }

  if (error || !mentor) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-red-500">{error || 'Mentor not found'}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl flex-shrink-0">
                {mentor.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{mentor.name}</h1>
                {mentor.headline && (
                  <p className="text-slate-600 mt-1">{mentor.headline}</p>
                )}

                <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                  {mentor.rating && (
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">&#9733;</span>
                      {mentor.rating.toFixed(1)} ({mentor.totalReviews} reviews)
                    </span>
                  )}
                  {mentor.totalMeetings > 0 && (
                    <span>{mentor.totalMeetings} sessions</span>
                  )}
                  {mentor.hourlyRate && (
                    <span className="font-semibold text-slate-700">${mentor.hourlyRate}/hr</span>
                  )}
                </div>

                {mentor.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {mentor.specialties.map((s: string) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button size="lg">Book Session</Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Bio */}
            <div className="md:col-span-2 space-y-6">
              {mentor.bio && (
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-lg font-semibold mb-3">About</h2>
                  <p className="text-slate-600 whitespace-pre-wrap">{mentor.bio}</p>
                </div>
              )}

              {mentor.expertise?.length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-lg font-semibold mb-3">Expertise</h2>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise.map((e: string) => (
                      <Badge key={e}>{e}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {mentor.languages?.length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-lg font-semibold mb-3">Languages</h2>
                  <div className="flex flex-wrap gap-2">
                    {mentor.languages.map((l: string) => (
                      <Badge key={l} variant="outline">{l}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {mentor.availability?.schedule?.length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-lg font-semibold mb-3">Availability</h2>
                  <p className="text-xs text-slate-400 mb-2">{mentor.availability.timezone}</p>
                  <div className="space-y-1.5 text-sm">
                    {mentor.availability.schedule.map((slot: any, i: number) => (
                      <p key={i}>
                        <span className="font-medium">{DAYS[slot.dayOfWeek]}</span>{' '}
                        {slot.startTime} - {slot.endTime}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
