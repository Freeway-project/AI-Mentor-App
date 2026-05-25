'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { BookingConfirmation } from './BookingConfirmation';
import { toast } from 'sonner';
import { ED } from '@/components/mentor-profile/editorial-theme';
import { frontendLogger } from '@/lib/frontend-logger';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: ED.accent,
    colorBackground: ED.card,
    colorText: ED.ink,
    colorDanger: '#b45309',
    borderRadius: '10px',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  rules: {
    '.Input': {
      borderColor: ED.rule,
      boxShadow: 'none',
    },
  },
};

interface Offer {
  id: string;
  title: string;
  price: number;
  durationMinutes: number;
}

interface Props {
  mentorId: string;
  mentorName: string;
  offer: Offer | null;
  hourlyRate?: number;
  slot: { start: string; end: string };
  calBookingUid?: string;
  onClose: () => void;
  onSuccess: (booking: any) => void;
}

function formatSlotDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Inner form — must live inside <Elements>
function StripePaymentForm({
  amountUsd,
  bookingPayload,
  onSuccess,
  onBack,
}: {
  amountUsd: number;
  bookingPayload: { mentorId: string; offerId?: string; scheduledAt: string; duration: number; title: string; calBookingUid?: string };
  onSuccess: (booking: any) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setError('');

    const { error: submitError } = await elements.submit();
    if (submitError) {
      frontendLogger.warn('Booking payment form submit failed', {
        mentorId: bookingPayload.mentorId,
        scheduledAt: bookingPayload.scheduledAt,
        error: submitError.message,
      });
      setError(submitError.message || 'Payment details are incomplete');
      setPaying(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (confirmError) {
      const msg = confirmError.message || 'Payment failed. Please try again.';
      frontendLogger.error('Stripe payment confirmation failed', {
        mentorId: bookingPayload.mentorId,
        scheduledAt: bookingPayload.scheduledAt,
        error: msg,
      });
      setError(msg);
      toast.error(msg);
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        frontendLogger.info('Booking creation after payment started', {
          mentorId: bookingPayload.mentorId,
          scheduledAt: bookingPayload.scheduledAt,
          paymentIntentId: paymentIntent.id,
        });
        const booking = await apiClient.createBooking({
          ...bookingPayload,
          paymentIntentId: paymentIntent.id,
        });
        frontendLogger.info('Booking creation after payment succeeded', {
          mentorId: bookingPayload.mentorId,
          meetingId: booking?.id,
          paymentIntentId: paymentIntent.id,
        });
        onSuccess(booking);
      } catch (err: any) {
        const msg = err.message || 'Booking failed after payment — please contact support';
        frontendLogger.error('Booking creation after payment failed', {
          mentorId: bookingPayload.mentorId,
          scheduledAt: bookingPayload.scheduledAt,
          paymentIntentId: paymentIntent.id,
          error: msg,
        });
        setError(msg);
        toast.error(msg);
        setPaying(false);
      }
    } else if (paymentIntent?.status === 'processing') {
      setError('Your payment is still processing. Please wait a moment and try again, or contact support.');
      setPaying(false);
    } else {
      frontendLogger.warn('Stripe payment not completed', {
        mentorId: bookingPayload.mentorId,
        scheduledAt: bookingPayload.scheduledAt,
        status: paymentIntent?.status,
      });
      setError('Payment was not completed. Please try again.');
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      {error && (
        <p
          className="text-sm rounded-lg px-3 py-2 border"
          style={{
            color: '#991b1b',
            background: 'rgba(254, 226, 226, 0.6)',
            borderColor: 'rgba(252, 165, 165, 0.8)',
          }}
        >
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={paying}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-lg transition-colors disabled:opacity-40 border font-medium"
          style={{
            color: ED.inkSoft,
            borderColor: ED.rule,
            background: 'transparent',
          }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={!stripe || paying}
          className="flex-1 py-2.5 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
          style={{ background: ED.ink }}
        >
          {paying ? 'Processing...' : `Pay $${amountUsd.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}

export function BookingModal({ mentorId, mentorName, offer, hourlyRate, slot, calBookingUid, onClose, onSuccess }: Props) {
  const durationMin = offer?.durationMinutes ?? 30;
  const amountUsd = offer?.price ?? (hourlyRate ? (durationMin <= 30 ? hourlyRate / 2 : hourlyRate) : 50);
  const sessionTitle = offer?.title ?? 'Mentoring Session';

  const [step, setStep] = useState<'summary' | 'payment' | 'success'>('summary');
  const [clientSecret, setClientSecret] = useState('');
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  const handleContinue = async () => {
    setLoadingIntent(true);
    try {
      frontendLogger.info('Create payment intent started', {
        mentorId,
        offerId: offer?.id,
        scheduledAt: slot.start,
        duration: durationMin,
      });
      const result = await apiClient.createPaymentIntent({
        mentorId,
        offerId: offer?.id,
        scheduledAt: slot.start,
        duration: durationMin,
      });
      frontendLogger.info('Create payment intent succeeded', {
        mentorId,
        offerId: offer?.id,
        scheduledAt: slot.start,
        paymentIntentId: result.paymentIntentId,
        amountUsd: result.amountUsd,
      });
      setClientSecret(result.clientSecret);
      setStep('payment');
    } catch (err: any) {
      frontendLogger.error('Create payment intent failed', {
        mentorId,
        offerId: offer?.id,
        scheduledAt: slot.start,
        error: err.message || 'Failed to initialize payment',
      });
      toast.error(err.message || 'Failed to initialize payment');
    } finally {
      setLoadingIntent(false);
    }
  };

  const handleSuccess = (b: any) => {
    setBooking(b);
    setStep('success');
    toast.success('Booking confirmed! Check your email for details.');
    onSuccess(b);
  };

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const modal = (
    // Portal to body so `fixed` is viewport-centered (not trapped in sticky column / transforms).
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      style={{
        background: 'rgba(28, 18, 8, 0.55)',
        backdropFilter: 'blur(8px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[min(90dvh,720px)] overflow-y-auto rounded-2xl shadow-2xl border"
        style={{
          background: ED.card,
          borderColor: ED.rule,
          boxShadow: '0 25px 50px -12px rgba(28, 18, 8, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${ED.accent}66, transparent)`,
          }}
        />

        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: ED.rule }}
        >
          <h2
            id="booking-modal-title"
            className="text-xl tracking-tight"
            style={{ fontFamily: '"Instrument Serif", serif', color: ED.ink, fontWeight: 400 }}
          >
            {step === 'summary' && 'Confirm Session'}
            {step === 'payment' && 'Secure Payment'}
            {step === 'success' && 'Booking Confirmed'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 transition-colors"
            style={{ color: ED.inkMuted }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {step === 'summary' && (
            <div className="space-y-5">
              <div
                className="rounded-xl p-4 space-y-3 text-sm border"
                style={{ background: ED.creamDeep + '99', borderColor: ED.rule, color: ED.inkSoft }}
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 flex-shrink-0" style={{ color: ED.accent }} />
                  <span>
                    with <strong style={{ color: ED.ink }}>{mentorName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: ED.accent }} />
                  <span>{formatSlotDate(slot.start)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: ED.accent }} />
                  <span>
                    {formatSlotTime(slot.start)} — {durationMin} min
                  </span>
                </div>
              </div>

              <div
                className="flex items-center justify-between rounded-xl px-4 py-3 border"
                style={{
                  background: ED.accentTint,
                  borderColor: ED.rule,
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: ED.ink }}>
                    {sessionTitle}
                  </p>
                  <p className="text-xs" style={{ color: ED.inkMuted }}>
                    {durationMin}-minute session
                  </p>
                </div>
                <p className="text-xl font-semibold tabular-nums" style={{ color: ED.ink }}>
                  ${amountUsd.toFixed(2)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={loadingIntent}
                className="w-full py-3 text-white font-semibold rounded-lg transition-opacity disabled:opacity-50"
                style={{ background: ED.ink }}
              >
                {loadingIntent ? 'Preparing payment...' : 'Continue to Payment →'}
              </button>

              <p className="text-center text-xs" style={{ color: ED.inkMuted }}>
                Secured by Stripe · Your card details are never stored on our servers
              </p>
            </div>
          )}

          {step === 'payment' && clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: stripeAppearance }}
            >
              <StripePaymentForm
                amountUsd={amountUsd}
                bookingPayload={{
                  mentorId,
                  offerId: offer?.id,
                  scheduledAt: slot.start,
                  duration: durationMin,
                  title: sessionTitle,
                  calBookingUid,
                }}
                onSuccess={handleSuccess}
                onBack={() => setStep('summary')}
              />
            </Elements>
          )}

          {step === 'payment' && (!clientSecret || !stripePromise) && (
            <p className="text-center text-sm py-6" style={{ color: ED.inkMuted }}>
              {!stripePromise ? 'Stripe is not configured.' : 'Loading payment form...'}
            </p>
          )}

          {step === 'success' && booking && (
            <BookingConfirmation booking={booking} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}
