/**
 * Time helpers that work in the *client's* local time.
 * The mobile app sends `tzOffset` = minutes AHEAD of UTC (e.g. Pakistan = 300).
 */
export const MIN = 60_000;
export const DAY = 86_400_000;

export function parseOffset(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) > 14 * 60) return 0;
  return Math.trunc(n);
}

/** Integer day number in the client's local time. */
export function dayKey(ms: number, off: number): number {
  return Math.floor((ms + off * MIN) / DAY);
}

export function startOfLocalDay(ms: number, off: number): number {
  return dayKey(ms, off) * DAY - off * MIN;
}

/** 0 = Sunday ... 6 = Saturday */
export function localDow(ms: number, off: number): number {
  return (dayKey(ms, off) + 4) % 7;
}

/** Week starts on Monday. */
export function startOfLocalWeek(ms: number, off: number): number {
  const mondayIndex = (localDow(ms, off) + 6) % 7;
  return startOfLocalDay(ms, off) - mondayIndex * DAY;
}

export function startOfLocalMonth(ms: number, off: number, monthDelta = 0): number {
  const d = new Date(ms + off * MIN);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + monthDelta, 1) - off * MIN;
}

export function monthLabel(ms: number, off: number): string {
  const d = new Date(ms + off * MIN);
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
    d.getUTCMonth()
  ];
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
