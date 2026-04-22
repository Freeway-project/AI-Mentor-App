export interface PendingBookingIntent {
  mentorId: string;
  offerId?: string;
  selectedDate?: string;
  selectedSlot?: { start: string; end: string };
  calPendingBooking?: { startTime: string; endTime: string; uid: string };
  savedAt: number;
}

const KEY = 'pendingBookingIntent';
const TTL = 60 * 60 * 1000; // 1 hour

export function savePendingBooking(data: Omit<PendingBookingIntent, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
}

export function loadPendingBooking(): PendingBookingIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const intent = JSON.parse(raw) as PendingBookingIntent;
    if (Date.now() - intent.savedAt > TTL) {
      localStorage.removeItem(KEY);
      return null;
    }
    return intent;
  } catch {
    return null;
  }
}

export function clearPendingBooking(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
