'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Clock, Users, Globe, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { BookingModal } from '@/components/booking/BookingModal';
import { toast } from 'sonner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MentorProfilePage() {
  const params = useParams();
  const mentorId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [mentor, setMentor] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([apiClient.getMentor(mentorId), apiClient.getMentorOffers(mentorId)])
      .then(([mentorData, offersData]) => {
        setMentor(mentorData);
        setOffers(offersData);
        if (offersData.length > 0) setSelectedOfferId(offersData[0].id);
      })
      .catch(err => setError(err.message || 'Mentor not found'))
      .finally(() => setLoading(false));
  }, [mentorId]);

  const selectedOffer = offers.find(o => o.id === selectedOfferId) ?? null;
  const durationMin = selectedOffer?.durationMinutes ?? 30;

  const handleSlotSelect = (slot: { start: string; end: string }) => {
    if (!user) {
      toast.error('Sign in to book a session');
      router.push(`/login?redirect=/mentors/${mentorId}`);
      return;
    }
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSlot(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-400">{error || 'Mentor not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}>
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>

      <Navbar />

      <div className="flex-1 relative z-10 w-full py-8 md:py-12">
        <div className="container mx-auto max-w-5xl px-4 md:px-6 space-y-6">

          {/* ── Profile hero ── */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 md:p-8 relative overflow-hidden shadow-xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-violet-600/20 to-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-3xl flex-shrink-0">
                {mentor.name?.charAt(0)?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{mentor.name}</h1>
                    {mentor.headline && (
                      <p className="text-slate-400 mt-1">{mentor.headline}</p>
                    )}
                  </div>
                  {mentor.hourlyRate && (
                    <span className="text-lg font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg flex-shrink-0">
                      ${mentor.hourlyRate}<span className="text-sm font-normal text-amber-500/70">/hr</span>
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-slate-400">
                  {mentor.rating && (
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-slate-200">{mentor.rating.toFixed(1)}</span>
                      <span>({mentor.totalReviews} reviews)</span>
                    </span>
                  )}
                  {mentor.totalMeetings > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {mentor.totalMeetings} sessions
                    </span>
                  )}
                  {mentor.verified && (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                  {mentor.availability?.timezone && (
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      {mentor.availability.timezone}
                    </span>
                  )}
                </div>

                {/* Specialties */}
                {mentor.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {mentor.specialties.map((s: string) => (
                      <Badge key={s} variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700/50 text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div className="grid md:grid-cols-5 gap-6 items-start">

            {/* ── Left: About / Expertise / Languages / Schedule ── */}
            <div className="md:col-span-3 space-y-5">
              {mentor.bio && (
                <section className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6">
                  <h2 className="text-base font-semibold text-white mb-3">About</h2>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{mentor.bio}</p>
                </section>
              )}

              {mentor.introVideoUrl && (
                <section className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6">
                  <h2 className="text-base font-semibold text-white mb-3">Intro Video</h2>
                  <video
                    src={mentor.introVideoUrl}
                    controls
                    className="w-full rounded-xl bg-slate-800/60 border border-slate-700/50"
                  />
                </section>
              )}

              {mentor.expertise?.length > 0 && (
                <section className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6">
                  <h2 className="text-base font-semibold text-white mb-3">Expertise</h2>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise.map((e: string) => (
                      <Badge key={e} variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700/50 text-xs">{e}</Badge>
                    ))}
                  </div>
                </section>
              )}

              {mentor.languages?.length > 0 && (
                <section className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6">
                  <h2 className="text-base font-semibold text-white mb-3">Languages</h2>
                  <div className="flex flex-wrap gap-2">
                    {mentor.languages.map((l: string) => (
                      <Badge key={l} variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700/50 text-xs">{l}</Badge>
                    ))}
                  </div>
                </section>
              )}

              {mentor.availability?.schedule?.length > 0 && (
                <section className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6">
                  <h2 className="text-base font-semibold text-white mb-3">Weekly Schedule</h2>
                  <div className="space-y-2 text-sm">
                    {mentor.availability.schedule.map((slot: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-800/60 last:border-0">
                        <span className="text-slate-300 font-medium">{DAYS[slot.dayOfWeek]}</span>
                        <span className="text-xs text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {slot.startTime} – {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ── Right: Sticky booking panel ── */}
            <div className="md:col-span-2">
              <div className="sticky top-6">
                <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

                  <h2 className="text-base font-semibold text-white mb-4">Book a Session</h2>

                  {/* Offer cards */}
                  {offers.length > 0 && (
                    <div className="space-y-2 mb-5">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Session type</p>
                      {offers.map((offer: any) => (
                        <button
                          key={offer.id}
                          onClick={() => { setSelectedOfferId(offer.id); setSelectedSlot(null); }}
                          className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                            selectedOfferId === offer.id
                              ? 'border-violet-500/60 bg-violet-500/10'
                              : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-white">{offer.title}</span>
                            <span className="text-sm font-bold text-amber-400">${offer.price}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{offer.durationMinutes} min</p>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-800/60 pt-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Pick a time</p>
                    <SlotPicker
                      mentorId={mentorId}
                      durationMin={durationMin}
                      onSlotSelect={handleSlotSelect}
                    />
                  </div>

                  {!selectedSlot && (
                    <p className="text-xs text-slate-500 text-center mt-4">
                      Select a time slot above to proceed
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking modal */}
      {showModal && selectedSlot && (
        <BookingModal
          mentorId={mentorId}
          mentorName={mentor.name}
          offer={selectedOffer}
          hourlyRate={mentor.hourlyRate}
          slot={selectedSlot}
          onClose={handleModalClose}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
