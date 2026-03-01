'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { toast } from 'sonner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MentorProfilePage() {
  const params = useParams();
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking state
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [booking, setBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    apiClient.getMentor(id)
      .then(data => {
        setMentor(data);
        // Load offers for booking flow
        return apiClient.getMentorOffers(id);
      })
      .then(data => setOffers(data))
      .catch((err) => setError(err.message || 'Mentor not found'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const selectedOffer = offers.find(o => o.id === selectedOfferId);
  const durationMin = selectedOffer?.durationMinutes ?? 30;

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      const result = await apiClient.createBooking({
        mentorId: mentor.id,
        offerId: selectedOfferId || undefined,
        scheduledAt: selectedSlot.start,
        duration: durationMin,
        title: selectedOffer?.title,
      });
      setConfirmedBooking(result);
      setShowBooking(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to book session');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center relative z-10 w-full">
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center relative z-10 w-full">
          <p className="text-red-400">{error || 'Mentor not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}>
      {/* Deep space base */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>

      <Navbar />
      <div className="flex-1 relative z-10 w-full py-8 md:py-12">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          {/* Header */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 md:p-8 mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-3xl flex-shrink-0 shadow-inner">
                {mentor.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white">{mentor.name}</h1>
                {mentor.headline && (
                  <p className="text-slate-400 mt-1.5 text-lg">{mentor.headline}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 text-sm text-slate-400">
                  {mentor.rating && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400">&#9733;</span>
                      <span className="font-medium text-slate-300">{mentor.rating.toFixed(1)}</span>
                      <span>({mentor.totalReviews} reviews)</span>
                    </span>
                  )}
                  {mentor.totalMeetings > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                      {mentor.totalMeetings} sessions
                    </span>
                  )}
                  {mentor.hourlyRate && (
                    <span className="font-semibold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-md">
                      ${mentor.hourlyRate}/hr
                    </span>
                  )}
                </div>

                {mentor.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-5">
                    {mentor.specialties.map((s: string) => (
                      <Badge key={s} variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700/50">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowBooking(s => !s)}
                className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 py-2.5 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-colors text-sm"
              >
                {showBooking ? 'Hide Booking' : 'Book Session'}
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Bio */}
            <div className="md:col-span-2 space-y-6">
              {mentor.bio && (
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 md:p-8">
                  <h2 className="text-lg font-semibold mb-4 text-white">About</h2>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{mentor.bio}</p>
                </div>
              )}

              {mentor.expertise?.length > 0 && (
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 md:p-8">
                  <h2 className="text-lg font-semibold mb-4 text-white">Expertise</h2>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise.map((e: string) => (
                      <Badge key={e} variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700/50">{e}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {mentor.languages?.length > 0 && (
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6">
                  <h2 className="text-lg font-semibold mb-4 text-white">Languages</h2>
                  <div className="flex flex-wrap gap-2">
                    {mentor.languages.map((l: string) => (
                      <Badge key={l} variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700/50">{l}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {mentor.availability?.schedule?.length > 0 && (
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6">
                  <h2 className="text-lg font-semibold mb-4 text-white">Availability</h2>
                  <p className="text-xs text-violet-400 mb-3 font-medium uppercase tracking-wider">{mentor.availability.timezone}</p>
                  <div className="space-y-2.5 text-sm">
                    {mentor.availability.schedule.map((slot: any, i: number) => (
                      <div key={i} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                        <span className="font-medium text-slate-300">{DAYS[slot.dayOfWeek]}</span>
                        <span className="text-slate-400 text-xs bg-slate-800/50 px-2 py-1 rounded">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Confirmed booking */}
          {confirmedBooking && (
            <div className="mt-6">
              <BookingConfirmation
                booking={confirmedBooking}
                onClose={() => setConfirmedBooking(null)}
              />
            </div>
          )}

          {/* Booking panel */}
          {showBooking && !confirmedBooking && (
            <div className="mt-6 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 md:p-8 space-y-6">
              <h2 className="text-lg font-semibold text-white">Book a Session</h2>

              {/* Offer selector */}
              {offers.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Session type</label>
                  <select
                    value={selectedOfferId}
                    onChange={e => setSelectedOfferId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500"
                  >
                    <option value="">Pick a session type...</option>
                    {offers.map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.title} — {o.durationMinutes} min ({o.price} credits)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Slot picker */}
              <div>
                <label className="block text-sm text-slate-400 mb-3">Choose a time slot</label>
                <SlotPicker
                  mentorId={mentor.id}
                  durationMin={durationMin}
                  onSlotSelect={setSelectedSlot}
                />
              </div>

              {/* Confirm button */}
              {selectedSlot && (
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-sm text-slate-400 mb-3">
                    Selected: <span className="text-white font-medium">
                      {new Date(selectedSlot.start).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </p>
                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {booking ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
