'use client';

import { track } from '@vercel/analytics';

/**
 * Thin wrapper around Vercel Analytics `track()`.
 * Provides typed helpers for the app's key conversion events.
 *
 * Usage:
 *   const { trackEvent, trackSignup, trackLogin, trackSessionBooked } = useAnalytics();
 *   trackSignup('mentee');
 */
export function useAnalytics() {
  /** Generic custom event */
  function trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
    track(name, properties);
  }

  function trackSignup(role: 'mentee' | 'mentor') {
    track('signup', { role });
  }

  function trackLogin(method: 'email' | 'google') {
    track('login', { method });
  }

  function trackSessionBooked(durationMin: 30 | 60, mentorId: string) {
    track('session_booked', { duration_min: durationMin, mentor_id: mentorId });
  }

  function trackSessionCancelled(sessionId: string) {
    track('session_cancelled', { session_id: sessionId });
  }

  function trackMentorProfileViewed(mentorId: string) {
    track('mentor_profile_viewed', { mentor_id: mentorId });
  }

  function trackCreditsPurchased(amount: number) {
    track('credits_purchased', { amount });
  }

  return {
    trackEvent,
    trackSignup,
    trackLogin,
    trackSessionBooked,
    trackSessionCancelled,
    trackMentorProfileViewed,
    trackCreditsPurchased,
  };
}
