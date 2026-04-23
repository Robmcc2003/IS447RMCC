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

// Stable key for "the week this date sits in" — uses the Monday start so
// two dates in the same week always collapse to the same key.
export function weekKey(date: Date): string {
  return toISO(startOfWeek(date));
}

// Stable key for "the month this date sits in", e.g. "2026-04".
export function monthKey(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Weekly or monthly, matching how targets are defined in the DB.
export type TargetPeriod = 'weekly' | 'monthly';

// Target-aware streak: how many consecutive prior periods (ending at the
// current one) did the user hit the target? If the current period hasn't
// hit target yet we don't count it as a broken streak — we just start
// counting from the previous one, so an in-progress period isn't punished.
export function computeTargetStreak(
  logs: { date: string; value: number }[],
  targetValue: number,
  period: TargetPeriod
): number {
  // A non-positive target would match trivially and isn't meaningful.
  if (targetValue <= 0) return 0;

  // Roll all logs up by their period key so we can just look up totals.
  const totals = new Map<string, number>();
  for (const log of logs) {
    const d = new Date(log.date);
    const key = period === 'weekly' ? weekKey(d) : monthKey(d);
    totals.set(key, (totals.get(key) ?? 0) + log.value);
  }

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // Step the cursor one period earlier in-place.
  const step = () => {
    if (period === 'weekly') {
      cursor.setDate(cursor.getDate() - 7);
    } else {
      cursor.setMonth(cursor.getMonth() - 1);
    }
  };

  const keyFor = (d: Date) => (period === 'weekly' ? weekKey(d) : monthKey(d));

  // If this period hasn't met the target yet, don't count it as broken —
  // just start counting from the previous period.
  if ((totals.get(keyFor(cursor)) ?? 0) < targetValue) {
    step();
  }

  let streak = 0;
  while ((totals.get(keyFor(cursor)) ?? 0) >= targetValue) {
    streak++;
    step();
  }

  return streak;
}

export type RangeKey = 'today' | '7d' | '30d' | '90d' | 'week' | 'month' | 'all';

export function rangeStart(key: RangeKey): Date | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (key) {
    case 'today':
      return now;
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
    case 'today':
      return 'Today';
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
