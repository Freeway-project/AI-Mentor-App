/**
 * Date and time utility functions
 */

export function formatDate(date: Date | string, format: 'date' | 'time' | 'datetime' = 'datetime'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'date':
      return d.toISOString().split('T')[0];
    case 'time':
      return d.toISOString().split('T')[1].split('.')[0];
    case 'datetime':
    default:
      return d.toISOString();
  }
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export function addHours(date: Date, hours: number): Date {
  return addMinutes(date, hours * 60);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

export function isBeforeNow(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
}

export function isAfterNow(date: Date | string): boolean {
  return !isBeforeNow(date);
}

export function getDayOfWeek(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay(); // 0 = Sunday, 6 = Saturday
}

export function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

export function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 60 + minutes;
}

export function isTimeBetween(timeStr: string, startStr: string, endStr: string): boolean {
  const time = timeToMinutes(timeStr);
  const start = timeToMinutes(startStr);
  const end = timeToMinutes(endStr);
  return time >= start && time <= end;
}

export function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
