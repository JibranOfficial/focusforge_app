const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d));
const pad = (n: number) => String(n).padStart(2, '0');

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Monday-based week start. */
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  return addDays(x, -((x.getDay() + 6) % 7));
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  const x = toDate(a);
  const y = toDate(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

/** 24-hour "08:00" */
export function formatTime24(d: Date | string): string {
  const x = toDate(d);
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

/** 12-hour "10:30 AM" */
export function formatTime12(d: Date | string): string {
  const x = toDate(d);
  const h = x.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(x.getMinutes())} ${suffix}`;
}

/** "Mon, Apr 28" */
export function formatDayLong(d: Date | string): string {
  const x = toDate(d);
  return `${DAYS[x.getDay()]}, ${MONTHS[x.getMonth()]} ${x.getDate()}`;
}

/** "Apr 28, 2025" */
export function formatDateShort(d: Date | string): string {
  const x = toDate(d);
  return `${MONTHS[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`;
}

export function dayShortName(d: Date | string): string {
  return DAYS[toDate(d).getDay()];
}

/** "Today", "Tomorrow" or "Mon, Apr 28" */
export function relativeDay(d: Date | string): string {
  const x = toDate(d);
  const today = startOfDay(new Date());
  if (isSameDay(x, today)) return 'Today';
  if (isSameDay(x, addDays(today, 1))) return 'Tomorrow';
  return formatDayLong(x);
}

/** 105 -> "1h 45m", 45 -> "45m", 120 -> "2h" */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

/** 1500 -> "25:00" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Combine the calendar day of `day` with the clock time of `time`. */
export function combineDateAndTime(day: Date, time: Date): Date {
  const x = new Date(day);
  x.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return x;
}
