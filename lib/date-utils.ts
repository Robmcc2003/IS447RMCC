export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfWeek(from: Date = new Date()): Date {
  const start = new Date(from);
  const diff = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function startOfMonth(from: Date = new Date()): Date {
  const start = new Date(from);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function computeStreak(logDates: string[]): number {
  const unique = new Set(logDates);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!unique.has(toISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (unique.has(toISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export type RangeKey = '7d' | '30d' | '90d' | 'week' | 'month' | 'all';

export function rangeStart(key: RangeKey): Date | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (key) {
    case '7d':
      return addDays(now, -6);
    case '30d':
      return addDays(now, -29);
    case '90d':
      return addDays(now, -89);
    case 'week':
      return startOfWeek(now);
    case 'month':
      return startOfMonth(now);
    case 'all':
    default:
      return null;
  }
}

export function rangeLabel(key: RangeKey): string {
  switch (key) {
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    case '90d':
      return 'Last 90 days';
    case 'week':
      return 'This week';
    case 'month':
      return 'This month';
    case 'all':
    default:
      return 'All time';
  }
}
