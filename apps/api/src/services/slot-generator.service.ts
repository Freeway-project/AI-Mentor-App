export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface MentorAvailability {
  timezone: string;
  schedule: AvailabilitySlot[];
}

export interface TimeRange {
  start: string; // ISO string
  end: string;   // ISO string
}

export interface GenerateSlotsParams {
  mentorAvailability: MentorAvailability;
  minNoticeHours: number;
  fromDate: Date;
  toDate: Date;
  durationMin: number;
  existingBookings: TimeRange[];
  busyTimes: TimeRange[];
}

export interface Slot {
  start: string;
  end: string;
}

function parseHHMM(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function generateSlots(params: GenerateSlotsParams): Slot[] {
  const {
    mentorAvailability,
    minNoticeHours,
    fromDate,
    toDate,
    durationMin,
    existingBookings,
    busyTimes,
  } = params;

  const now = new Date();
  const minNoticeMs = minNoticeHours * 60 * 60 * 1000;
  const durationMs = durationMin * 60 * 1000;

  // Pre-parse busy/booking ranges as Date pairs
  const blockedRanges: { start: Date; end: Date }[] = [
    ...existingBookings,
    ...busyTimes,
  ].map(r => ({ start: new Date(r.start), end: new Date(r.end) }));

  const slots: Slot[] = [];

  // Iterate each day in [fromDate, toDate]
  const cursor = new Date(fromDate);
  cursor.setUTCHours(0, 0, 0, 0);
  const endDay = new Date(toDate);
  endDay.setUTCHours(23, 59, 59, 999);

  while (cursor <= endDay) {
    const dayOfWeek = cursor.getUTCDay();

    // Get all weekly rules for this day
    const rules = mentorAvailability.schedule.filter(r => r.dayOfWeek === dayOfWeek);

    for (const rule of rules) {
      const { hours: startH, minutes: startM } = parseHHMM(rule.startTime);
      const { hours: endH, minutes: endM } = parseHHMM(rule.endTime);

      // Build window start/end in UTC using mentor's stated times
      // (We treat the mentor's schedule times as UTC for simplicity;
      //  full timezone offset can be layered on if needed.)
      const windowStart = new Date(cursor);
      windowStart.setUTCHours(startH, startM, 0, 0);

      const windowEnd = new Date(cursor);
      windowEnd.setUTCHours(endH, endM, 0, 0);

      if (windowEnd <= windowStart) continue;

      // Slice window into durationMin slots
      let slotStart = new Date(windowStart);
      while (slotStart.getTime() + durationMs <= windowEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + durationMs);

        // Filter: must be in future with minNotice
        if (slotStart.getTime() < now.getTime() + minNoticeMs) {
          slotStart = new Date(slotStart.getTime() + durationMs);
          continue;
        }

        // Filter: must be within requested range
        if (slotStart < fromDate || slotEnd > new Date(toDate.getTime() + 24 * 60 * 60 * 1000)) {
          slotStart = new Date(slotStart.getTime() + durationMs);
          continue;
        }

        // Filter: must not overlap any blocked range
        const isBlocked = blockedRanges.some(r => overlaps(slotStart, slotEnd, r.start, r.end));
        if (!isBlocked) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
          });
        }

        slotStart = new Date(slotStart.getTime() + durationMs);
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return slots.sort((a, b) => a.start.localeCompare(b.start));
}
