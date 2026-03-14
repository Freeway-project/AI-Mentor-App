'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { BookingConfirmation } from './BookingConfirmation';
import { toast } from 'sonner';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const stripeAppearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#7c3aed',
    colorBackground: '#1e293b',
    colorText: '#e2e8f0',
    colorDanger: '#f87171',
    borderRadius: '8px',
    fontFamily: 'system-ui, sans-serif',
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
  bookingPayload: { mentorId: string; offerId?: string; scheduledAt: string; duration: number; title: string };
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
      setError(confirmError.message || 'Payment failed');
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        const booking = await apiClient.createBooking({
          ...bookingPayload,
          paymentIntentId: paymentIntent.id,
        });
        onSuccess(booking);
      } catch (err: any) {
        setError(err.message || 'Booking failed after payment — please contact support');
        setPaying(false);
      }
    } else {
      setError('Payment was not completed. Please try again.');
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
      )}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onBack}
          disabled={paying}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handlePay}
          disabled={!stripe || paying}
          className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 text-sm"
        >
          {paying ? 'Processing...' : `Pay $${amountUsd.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}

export function BookingModal({ mentorId, mentorName, offer, hourlyRate, slot, onClose, onSuccess }: Props) {
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
      const result = await apiClient.createPaymentIntent({
        mentorId,
        offerId: offer?.id,
        scheduledAt: slot.start,
        duration: durationMin,
      });
      setClientSecret(result.clientSecret);
      setStep('payment');
    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize payment');
    } finally {
      setLoadingIntent(false);
    }
  };

  const handleSuccess = (b: any) => {
    setBooking(b);
    setStep('success');
    onSuccess(b);
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">
            {step === 'summary' && 'Confirm Session'}
            {step === 'payment' && 'Secure Payment'}
            {step === 'success' && 'Booking Confirmed'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === 'summary' && (
            <div className="space-y-5">
              {/* Session details */}
              <div className="bg-slate-800/50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <User className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <span>with <strong className="text-white">{mentorName}</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Calendar className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <span>{formatSlotDate(slot.start)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Clock className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <span>{formatSlotTime(slot.start)} — {durationMin} min</span>
                </div>
              </div>

              {/* Price summary */}
              <div className="flex items-center justify-between bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{sessionTitle}</p>
                  <p className="text-xs text-slate-400">{durationMin}-minute session</p>
                </div>
                <p className="text-xl font-bold text-white">${amountUsd.toFixed(2)}</p>
              </div>

              <button
                onClick={handleContinue}
                disabled={loadingIntent}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingIntent ? 'Preparing payment...' : 'Continue to Payment →'}
              </button>

              <p className="text-center text-xs text-slate-500">
                Secured by Stripe &bull; Your card details are never stored on our servers
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
                }}
                onSuccess={handleSuccess}
                onBack={() => setStep('summary')}
              />
            </Elements>
          )}

          {step === 'payment' && (!clientSecret || !stripePromise) && (
            <p className="text-center text-slate-400 text-sm py-6">
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
}
