/**
 * Pending booking intent: persisted in localStorage and mirrored in Redux (`pendingBooking` slice).
 * Survives full page reloads and auth redirects; TTL 1 hour.
 */

export type BookingFlowStep = 'date' | 'service' | 'confirm';

export interface PendingBookingIntent {
  mentorId: string;
  offerId?: string;
  selectedDate?: string;
  selectedSlot?: { start: string; end: string };
  calPendingBooking?: { startTime: string; endTime: string; uid: string };
  /** Where to resume the 3-step flow (date → session type → confirm). */
  bookingStep?: BookingFlowStep;
  monthCursor?: { year: number; month: number };
  savedAt: number;
}

const KEY = 'pendingBookingIntent';
const TTL = 60 * 60 * 1000; // 1 hour

function isExpired(intent: PendingBookingIntent): boolean {
  return Date.now() - intent.savedAt > TTL;
}

export function readPendingIntentFromStorage(): PendingBookingIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const intent = JSON.parse(raw) as PendingBookingIntent;
    if (isExpired(intent)) {
      localStorage.removeItem(KEY);
      return null;
    }
    return intent;
  } catch {
    return null;
  }
}

export function writePendingIntentToStorage(intent: PendingBookingIntent): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(intent));
}

export function clearPendingIntentStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}

/** @deprecated Prefer `useAppSelector` / dispatch; kept for auth pages and non-React reads. */
export function loadPendingBooking(): PendingBookingIntent | null {
  return readPendingIntentFromStorage();
}

/** @deprecated Use `dispatch(pendingBookingActions.saveIntent(...))` from components. */
export function savePendingBooking(data: Omit<PendingBookingIntent, 'savedAt'>): void {
  const intent: PendingBookingIntent = { ...data, savedAt: Date.now() };
  writePendingIntentToStorage(intent);
}

/** @deprecated Use `dispatch(pendingBookingActions.clearIntent())`. */
export function clearPendingBooking(): void {
  clearPendingIntentStorage();
}
