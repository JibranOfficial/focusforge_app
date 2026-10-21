import { prisma } from '../prisma';
import { DAY, dayKey } from './time';

/** Consecutive local days (ending today, or yesterday if nothing yet today) with at least one focus session. */
export async function computeStreak(userId: string, off: number): Promise<number> {
  const since = new Date(Date.now() - 400 * DAY);
  const sessions = await prisma.focusSession.findMany({
    where: { userId, startedAt: { gte: since }, durationMinutes: { gt: 0 } },
    select: { startedAt: true },
  });

  const days = new Set(sessions.map((s) => dayKey(s.startedAt.getTime(), off)));
  const today = dayKey(Date.now(), off);

  let cursor = days.has(today) ? today : today - 1;
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}
