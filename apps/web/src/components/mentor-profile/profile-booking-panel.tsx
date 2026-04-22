'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import nextDynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { ed, ED } from './editorial-theme';
import type { MentorOffer } from './types';

const BookingModal = nextDynamic(
  () => import('@/components/booking/BookingModal').then((m) => m.BookingModal),
  { ssr: false }
);

const CalBookingEmbed = nextDynamic(
  () => import('@/components/booking/CalBookingEmbed').then((m) => m.CalBookingEmbed),
  { ssr: false }
);

interface Slot {
  start: string;
  end: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function monthStart(year: number, month: number) {
  return new Date(year, month, 1);
}

// ─── Editorial Calendar ─────────────────────────────────────────────────────

function EditorialCalendar({
  slotsByDate,
  selectedDate,
  onSelectDate,
  loading,
  monthCursor,
  onMonthChange,
}: {
  slotsByDate: Record<string, Slot[]>;
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
  loading: boolean;
  monthCursor: { year: number; month: number };
  onMonthChange: (delta: number) => void;
}) {
  const { year, month } = monthCursor;
  const mStart = monthStart(year, month);
  const mEnd = new Date(year, month + 1, 0);
  const leadBlanks = (mStart.getDay() + 6) % 7; // Monday-start
  const daysInMonth = mEnd.getDate();
  const todayISO = toISO(new Date());

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = mStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Month nav */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <button
          onClick={() => onMonthChange(-1)}
          style={{
            width: 32,
            height: 32,
            border: `1px solid ${ED.rule}`,
            background: 'transparent',
            cursor: 'pointer',
            color: ED.ink,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={14} />
        </button>
        <div style={ed.serif(24, ED.ink, { letterSpacing: -0.3 })}>{monthLabel}</div>
        <button
          onClick={() => onMonthChange(1)}
          style={{
            width: 32,
            height: 32,
            border: `1px solid ${ED.rule}`,
            background: 'transparent',
            cursor: 'pointer',
            color: ED.ink,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekday header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10,
          color: ED.inkMuted,
          letterSpacing: '0.15em',
          textAlign: 'center',
          paddingBottom: 8,
          borderBottom: `1px solid ${ED.rule}`,
          marginBottom: 8,
          textTransform: 'uppercase',
        }}
      >
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          rowGap: 4,
          opacity: loading ? 0.5 : 1,
          transition: 'opacity 150ms',
        }}
      >
        {cells.map((d, i) => {
          if (!d) return <div key={i} style={{ height: 38 }} />;
          const iso = toISO(d);
          const slots = slotsByDate[iso] || [];
          const isPast = iso < todayISO;
          const isAvailable = !isPast && slots.length > 0;
          const isSelected = selectedDate === iso;

          let bg = 'transparent';
          let fg = isPast ? ED.rule : ED.ink;
          let border = '1px solid transparent';
          if (isAvailable && !isSelected) {
            bg = ED.accentTint;
            fg = ED.accentDeep;
          }
          if (isSelected) {
            bg = ED.ink;
            fg = ED.cream;
          }

          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                disabled={!isAvailable}
                onClick={() => onSelectDate(iso)}
                style={{
                  width: 38,
                  height: 38,
                  background: bg,
                  color: fg,
                  border,
                  cursor: isAvailable ? 'pointer' : 'default',
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: 18,
                  letterSpacing: -0.3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  position: 'relative',
                  transition: 'all 100ms ease',
                }}
              >
                {d.getDate()}
                {isAvailable && !isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 3,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 3,
                      height: 3,
                      borderRadius: '50%',
                      background: ED.accent,
                    }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 18,
          marginTop: 14,
          paddingTop: 10,
          borderTop: `1px solid ${ED.rule}`,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10,
          color: ED.inkMuted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: ED.accentTint, border: `1px solid ${ED.rule}` }} />
          Available
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: ED.ink }} />
          Selected
        </span>
      </div>
    </div>
  );
}

// ─── Time slots ─────────────────────────────────────────────────────────────

function TimeSlots({
  date,
  slots,
  selectedSlot,
  onSelectSlot,
  timezone,
}: {
  date: string | null;
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelectSlot: (slot: Slot) => void;
  timezone?: string;
}) {
  if (!date) {
    return (
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          color: ED.inkMuted,
          fontStyle: 'italic',
          margin: '16px 0 0',
        }}
      >
        Pick a date above to see available times.
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: ED.inkMuted, margin: '16px 0 0' }}>
        No times on this day. Try another.
      </p>
    );
  }

  const niceDate = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div style={{ marginTop: 16 }}>
      <div style={ed.mono(10, ED.inkMuted, { marginBottom: 10 })}>
        {niceDate}{timezone ? ` · ${timezone.replace(/_/g, ' ')}` : ''}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: 8,
        }}
      >
        {slots.map((slot) => {
          const active = selectedSlot?.start === slot.start;
          return (
            <button
              key={slot.start}
              onClick={() => onSelectSlot(slot)}
              style={{
                padding: '11px 8px',
                background: active ? ED.ink : ED.card,
                color: active ? ED.cream : ED.ink,
                border: `1px solid ${active ? ED.ink : ED.rule}`,
                cursor: 'pointer',
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 13,
                letterSpacing: '0.04em',
                transition: 'all 100ms ease',
              }}
            >
              {formatTime(slot.start)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Confirm row ─────────────────────────────────────────────────────────────

function ConfirmRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        paddingBottom: 10,
        borderBottom: `1px solid ${ED.rule}`,
      }}
    >
      <span style={ed.mono(10, ED.inkMuted)}>{label}</span>
      <span
        style={{
          fontFamily: emphasis ? '"Instrument Serif", serif' : 'Inter, sans-serif',
          fontSize: emphasis ? 22 : 14,
          color: ED.ink,
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

type Step = 'date' | 'service' | 'confirm' | 'done';

const STEPS: { key: Step; label: string }[] = [
  { key: 'date', label: 'Date & time' },
  { key: 'service', label: 'Session type' },
  { key: 'confirm', label: 'Confirm' },
];

export function MentorProfileBookingPanel({
  mentorId,
  mentorName,
  offers,
  hourlyRate,
  introVideoUrl,
  calLink,
}: {
  mentorId: string;
  mentorName: string;
  offers: MentorOffer[];
  hourlyRate?: number;
  introVideoUrl?: string;
  calLink?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();

  // Cal.com embed state
  const [calPendingBooking, setCalPendingBooking] = useState<{ startTime: string; endTime: string; uid: string } | null>(null);
  const [calDone, setCalDone] = useState(false);

  const [step, setStep] = useState<Step>('date');
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [slotsByDate, setSlotsByDate] = useState<Record<string, Slot[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState(offers[0]?.id || '');
  const [showModal, setShowModal] = useState(false);

  const selectedOffer = useMemo(
    () => offers.find((o) => o.id === selectedOfferId) ?? offers[0] ?? null,
    [offers, selectedOfferId]
  );

  const durationMin = selectedOffer?.durationMinutes ?? 30;

  // Fetch slots for the visible month range
  const fetchMonthSlots = useCallback(
    async (year: number, month: number) => {
      const from = `${year}-${pad(month + 1)}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const to = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

      setLoadingSlots(true);
      try {
        const data = await apiClient.getAvailableSlots(mentorId, from, to, durationMin);
        const grouped: Record<string, Slot[]> = {};
        for (const slot of data.slots as Slot[]) {
          const day = slot.start.slice(0, 10);
          if (!grouped[day]) grouped[day] = [];
          grouped[day].push(slot);
        }
        setSlotsByDate((prev) => ({ ...prev, ...grouped }));
      } catch {
        // Silently fail; calendar will show no available dates
      } finally {
        setLoadingSlots(false);
      }
    },
    [mentorId, durationMin]
  );

  useEffect(() => {
    fetchMonthSlots(monthCursor.year, monthCursor.month);
  }, [monthCursor, fetchMonthSlots]);

  const handleMonthChange = (delta: number) => {
    setMonthCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const handleDateSelect = (iso: string) => {
    setSelectedDate(iso);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: Slot) => {
    if (!user) {
      toast.error('Sign in to book a session');
      router.push(`/login?redirect=/mentors/${mentorId}`);
      return;
    }
    setSelectedSlot(slot);
  };

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const canAdvanceDate = selectedDate && selectedSlot;

  const dateSlotsForSelected = selectedDate ? (slotsByDate[selectedDate] || []) : [];

  // ── Cal.com embed path ──────────────────────────────────────────────────────
  if (calLink) {
    const calOffer = offers[0] ?? null;

    const handleCalBookingSuccess = (data: { startTime: string; endTime: string; uid: string }) => {
      if (!user) {
        toast.error('Sign in to complete your booking');
        router.push(`/login?redirect=/mentors/${mentorId}`);
        return;
      }
      setCalPendingBooking(data);
    };

    const handleCalModalClose = async () => {
      if (calPendingBooking) {
        try {
          await apiClient.cancelCalBooking(calPendingBooking.uid);
        } catch {
          // Best-effort cancel
        }
        setCalPendingBooking(null);
      }
    };

    return (
      <>
        <div
          style={{
            background: ED.card,
            border: `1px solid ${ED.rule}`,
            padding: 28,
            position: 'sticky',
            top: 24,
          }}
        >
          {calDone ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={ed.mono(10, ED.inkMuted)}>Booking complete</div>
              <div style={{ padding: 20, border: `1px solid ${ED.ink}`, background: ED.cream }}>
                <Check size={22} color={ED.accent} strokeWidth={1.6} />
                <div style={ed.serif(26, ED.ink, { marginTop: 10, lineHeight: 1.15 })}>
                  Confirmation sent.
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: ED.inkSoft, marginTop: 6, lineHeight: 1.5 }}>
                  Check your email for your booking details and video link.
                </div>
              </div>
              <button
                onClick={() => setCalDone(false)}
                style={{ padding: '12px 22px', background: 'transparent', border: `1px solid ${ED.ink}`, color: ED.ink, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500 }}
              >
                Book another →
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={ed.mono(10, ED.inkMuted)}>Book a session</div>
                <h3 style={ed.serif(28, ED.ink, { margin: '4px 0 0', letterSpacing: -0.3 })}>
                  Pick a time
                </h3>
              </div>
              <CalBookingEmbed calLink={calLink} onBookingSuccess={handleCalBookingSuccess} />
            </>
          )}
        </div>

        {calPendingBooking && (
          <BookingModal
            mentorId={mentorId}
            mentorName={mentorName}
            offer={calOffer}
            hourlyRate={hourlyRate}
            slot={{ start: calPendingBooking.startTime, end: calPendingBooking.endTime }}
            calBookingUid={calPendingBooking.uid}
            onClose={handleCalModalClose}
            onSuccess={() => {
              setCalPendingBooking(null);
              setCalDone(true);
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        id="booking-panel"
        style={{
          background: ED.card,
          border: `1px solid ${ED.rule}`,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          position: 'sticky',
          top: 24,
        }}
      >
        {/* Header */}
        <div>
          <div style={ed.mono(10, ED.inkMuted)}>
            Booking · Step {step === 'done' ? '✓' : `${stepIdx + 1}/3`}
          </div>
          <h3 style={ed.serif(28, ED.ink, { margin: '4px 0 0', letterSpacing: -0.3 })}>
            {step === 'date' && 'Pick a time'}
            {step === 'service' && 'Pick a format'}
            {step === 'confirm' && 'One last look'}
            {step === 'done' && "You're booked."}
          </h3>
        </div>

        {/* Progress bar */}
        {step !== 'done' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                style={{
                  flex: 1,
                  height: 3,
                  background: i <= stepIdx ? ED.ink : ED.rule,
                  transition: 'background 200ms ease',
                }}
              />
            ))}
          </div>
        )}

        {/* Step: date + time */}
        {step === 'date' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <EditorialCalendar
              slotsByDate={slotsByDate}
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              loading={loadingSlots}
              monthCursor={monthCursor}
              onMonthChange={handleMonthChange}
            />
            <TimeSlots
              date={selectedDate}
              slots={dateSlotsForSelected}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSlotSelect}
            />
          </div>
        )}

        {/* Step: service selection */}
        {step === 'service' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {offers.map((offer) => {
              const active = offer.id === selectedOfferId;
              return (
                <label
                  key={offer.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 1fr auto',
                    gap: 14,
                    alignItems: 'start',
                    padding: 16,
                    cursor: 'pointer',
                    background: active ? ED.cream : 'transparent',
                    border: `1px solid ${active ? ED.ink : ED.rule}`,
                    transition: 'all 100ms ease',
                  }}
                >
                  <input
                    type="radio"
                    name="svc"
                    checked={active}
                    onChange={() => setSelectedOfferId(offer.id)}
                    style={{ accentColor: ED.ink, marginTop: 3 }}
                  />
                  <div>
                    <div style={ed.serif(20, ED.ink, { lineHeight: 1.1 })}>{offer.title}</div>
                    <div style={ed.mono(10, ED.inkMuted, { marginTop: 2 })}>
                      {offer.durationMinutes} min
                    </div>
                    {offer.description && (
                      <div
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 12.5,
                          color: ED.inkSoft,
                          marginTop: 6,
                          lineHeight: 1.5,
                        }}
                      >
                        {offer.description}
                      </div>
                    )}
                  </div>
                  <div style={ed.serif(20, offer.price === 0 ? ED.accent : ED.ink)}>
                    {offer.price === 0 ? 'Free' : `$${offer.price}`}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Step: confirm */}
        {step === 'confirm' && selectedSlot && selectedOffer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ConfirmRow label="With" value={mentorName} />
            <ConfirmRow
              label="Format"
              value={`${selectedOffer.title} · ${selectedOffer.durationMinutes} min`}
            />
            <ConfirmRow
              label="Date"
              value={new Date(selectedSlot.start).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
            <ConfirmRow
              label="Time"
              value={formatTime(selectedSlot.start)}
            />
            <ConfirmRow
              label="Total"
              value={selectedOffer.price === 0 ? 'Free' : `$${selectedOffer.price}`}
              emphasis
            />
            <div
              style={{
                padding: 14,
                background: ED.creamDeep,
                fontFamily: 'Inter, sans-serif',
                fontSize: 12.5,
                color: ED.inkSoft,
                lineHeight: 1.5,
              }}
            >
              You&apos;ll get a calendar invite and a video link by email within a few minutes.
              Cancel or reschedule up to 24 hours before — no charge.
            </div>
          </div>
        )}

        {/* Done state */}
        {step === 'done' && selectedSlot && selectedOffer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                padding: 20,
                border: `1px solid ${ED.ink}`,
                background: ED.cream,
              }}
            >
              <Check size={22} color={ED.accent} strokeWidth={1.6} />
              <div style={ed.serif(26, ED.ink, { marginTop: 10, lineHeight: 1.15 })}>
                Confirmation sent.
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: ED.inkSoft,
                  marginTop: 6,
                  lineHeight: 1.5,
                }}
              >
                {selectedOffer.title} with {mentorName.split(' ')[0]} —{' '}
                {new Date(selectedSlot.start).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                at {formatTime(selectedSlot.start)}.
              </div>
            </div>
            <button
              onClick={() => {
                setStep('date');
                setSelectedDate(null);
                setSelectedSlot(null);
              }}
              style={{
                padding: '12px 22px',
                background: 'transparent',
                border: `1px solid ${ED.ink}`,
                color: ED.ink,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Book another →
            </button>
          </div>
        )}

        {/* Footer actions */}
        {step !== 'done' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              paddingTop: 16,
              borderTop: `1px solid ${ED.rule}`,
            }}
          >
            <button
              onClick={() => {
                if (step === 'service') setStep('date');
                else if (step === 'confirm') setStep('service');
              }}
              disabled={step === 'date'}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: step === 'date' ? 'default' : 'pointer',
                color: step === 'date' ? ED.rule : ED.ink,
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ← Back
            </button>

            <button
              disabled={
                (step === 'date' && !canAdvanceDate) ||
                (step === 'service' && !selectedOfferId)
              }
              onClick={() => {
                if (step === 'date') setStep('service');
                else if (step === 'service') setStep('confirm');
                else if (step === 'confirm') setShowModal(true);
              }}
              style={{
                padding: '12px 22px',
                background: ED.ink,
                color: ED.cream,
                border: 'none',
                cursor:
                  (step === 'date' && !canAdvanceDate) || (step === 'service' && !selectedOfferId)
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  (step === 'date' && !canAdvanceDate) || (step === 'service' && !selectedOfferId)
                    ? 0.4
                    : 1,
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'opacity 150ms',
              }}
            >
              {step === 'confirm' ? 'Confirm booking →' : 'Continue →'}
            </button>
          </div>
        )}
      </div>

      {showModal && selectedSlot ? (
        <BookingModal
          mentorId={mentorId}
          mentorName={mentorName}
          offer={selectedOffer}
          hourlyRate={hourlyRate}
          slot={selectedSlot}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setStep('done');
          }}
        />
      ) : null}
    </>
  );
}

export function MentorProfileBookingPanelFallback() {
  return (
    <div
      style={{
        background: ED.card,
        border: `1px solid ${ED.rule}`,
        padding: 28,
        position: 'sticky',
        top: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          opacity: 0.5,
          animation: 'pulse 2s infinite',
        }}
      >
        {[28, 48, 60, 120, 80].map((h, i) => (
          <div
            key={i}
            style={{ height: h, background: ED.rule, borderRadius: 2 }}
          />
        ))}
      </div>
    </div>
  );
}
