'use client';

import { useMemo, useState } from 'react';
import nextDynamic from 'next/dynamic';
import { CalendarDays, Clock3, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { AppPanel, AppSectionLabel } from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { MentorOffer } from './types';

const BookingModal = nextDynamic(
  () => import('@/components/booking/BookingModal').then((module) => module.BookingModal),
  { ssr: false }
);

interface Slot {
  start: string;
  end: string;
}

export function MentorProfileBookingPanel({
  mentorId,
  mentorName,
  offers,
  hourlyRate,
  introVideoUrl,
}: {
  mentorId: string;
  mentorName: string;
  offers: MentorOffer[];
  hourlyRate?: number;
  introVideoUrl?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedOfferId, setSelectedOfferId] = useState<string>(offers[0]?.id || '');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showModal, setShowModal] = useState(false);

  const selectedOffer = useMemo(
    () => offers.find((offer) => offer.id === selectedOfferId) ?? offers[0] ?? null,
    [offers, selectedOfferId]
  );

  const durationMin = selectedOffer?.durationMinutes ?? 30;

  const handleSlotSelect = (slot: Slot) => {
    if (!user) {
      toast.error('Sign in to book a session');
      router.push(`/login?redirect=/mentors/${mentorId}`);
      return;
    }

    setSelectedSlot(slot);
    setShowModal(true);
  };

  return (
    <>
      <AppPanel id="booking-panel" className="sticky top-24 overflow-hidden p-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />

        <div className="relative z-10 space-y-5">
          <div>
            <AppSectionLabel>Book This Mentor</AppSectionLabel>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Start with the right session</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pick an offer, check live availability, and confirm a time without leaving the page.
            </p>
          </div>

          {introVideoUrl ? (
            <a
              href="#intro-video"
              className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/20"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Watch intro video first
            </a>
          ) : null}

          {offers.length > 0 ? (
            <div className="space-y-3">
              <AppSectionLabel>Session Type</AppSectionLabel>
              {offers.map((offer) => {
                const active = offer.id === selectedOffer?.id;
                return (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => {
                      setSelectedOfferId(offer.id);
                      setSelectedSlot(null);
                    }}
                    className={cn(
                      'w-full rounded-2xl border px-4 py-4 text-left transition-all',
                      active
                        ? 'border-brand/50 bg-brand/10 shadow-[0_0_0_1px_rgba(124,58,237,0.12)]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{offer.title}</p>
                        {offer.description ? (
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {offer.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-slate-900">${offer.price}</p>
                        <p className="mt-1 text-xs text-slate-500">{offer.durationMinutes} min</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">Custom session pricing available</p>
              <p className="mt-1 text-xs text-slate-500">
                Pricing will be based on the mentor&apos;s default rate.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-brand" />
              <div>
                <p className="text-sm font-medium text-slate-900">Selected session</p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedOffer ? selectedOffer.title : 'Mentoring Session'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedOffer ? `$${selectedOffer.price}` : hourlyRate ? `From $${hourlyRate}` : 'Custom pricing'} · {durationMin} min
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-5">
            <AppSectionLabel>Pick a Time</AppSectionLabel>
            <SlotPicker
              mentorId={mentorId}
              durationMin={durationMin}
              onSlotSelect={handleSlotSelect}
            />

            {!selectedSlot ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-center text-xs text-slate-500">
                Select a slot above to continue to secure checkout.
              </div>
            ) : (
              <div className="rounded-2xl border border-brand/20 bg-brand/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-brand" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Selected slot</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {new Date(selectedSlot.start).toLocaleString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppPanel>

      {showModal && selectedSlot ? (
        <BookingModal
          mentorId={mentorId}
          mentorName={mentorName}
          offer={selectedOffer}
          hourlyRate={hourlyRate}
          slot={selectedSlot}
          onClose={() => {
            setShowModal(false);
            setSelectedSlot(null);
          }}
          onSuccess={() => setShowModal(false)}
        />
      ) : null}
    </>
  );
}

export function MentorProfileBookingPanelFallback() {
  return (
    <AppPanel className="sticky top-24 p-5">
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-16 rounded-2xl bg-slate-100" />
        <div className="h-16 rounded-2xl bg-slate-100" />
        <div className="h-16 rounded-2xl bg-slate-100" />
        <div className="h-40 rounded-2xl bg-slate-100" />
      </div>
    </AppPanel>
  );
}
