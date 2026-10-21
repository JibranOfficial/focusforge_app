import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { uid } from '../middleware/auth';
import { publicTask } from '../utils/serialize';
import { computeStreak } from '../utils/streak';
import {
  DAY,
  MIN,
  WEEKDAY_LABELS,
  dayKey,
  monthLabel,
  parseOffset,
  startOfLocalDay,
  startOfLocalMonth,
  startOfLocalWeek,
} from '../utils/time';

const router = Router();

const subjectSelect = { select: { id: true, name: true, icon: true, color: true } } as const;

// ---------------------------------------------------------------------------
// GET /stats/home?tzOffset=300
// ---------------------------------------------------------------------------
router.get('/home', async (req, res) => {
  const userId = uid(req);
  const off = parseOffset(req.query.tzOffset);
  const now = Date.now();
  const dayStart = startOfLocalDay(now, off);
  const dayEnd = dayStart + DAY;

  const [user, todayTasks, studied, streak] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.task.findMany({
      where: { userId, scheduledAt: { gte: new Date(dayStart), lt: new Date(dayEnd) } },
      include: { subject: subjectSelect },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.focusSession.aggregate({
      where: { userId, startedAt: { gte: new Date(dayStart), lt: new Date(dayEnd) } },
      _sum: { durationMinutes: true },
    }),
    computeStreak(userId, off),
  ]);

  const studiedMinutes = studied._sum.durationMinutes ?? 0;
  const plannedMinutes = todayTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const sessionsDone = todayTasks.filter((t) => t.status === 'COMPLETED').length;
  const percent =
    plannedMinutes === 0 ? 0 : Math.min(100, Math.round((studiedMinutes / plannedMinutes) * 100));

  // Next session: first pending task that hasn't already ended today, else the next pending task overall.
  let next = todayTasks.find(
    (t) => t.status === 'PENDING' && t.scheduledAt.getTime() + t.estimatedMinutes * MIN > now,
  );
  if (!next) {
    next =
      todayTasks.find((t) => t.status === 'PENDING') ??
      (await prisma.task.findFirst({
        where: { userId, status: 'PENDING', scheduledAt: { gte: new Date(dayEnd) } },
        include: { subject: subjectSelect },
        orderBy: { scheduledAt: 'asc' },
      })) ??
      undefined;
  }

  res.json({
    user: { name: user.name, xp: user.xp },
    today: {
      percent,
      sessionsDone,
      sessionsTotal: todayTasks.length,
      studiedMinutes,
      plannedMinutes,
    },
    streak,
    next: next ? publicTask(next) : null,
    tasks: todayTasks.map(publicTask),
  });
});

// ---------------------------------------------------------------------------
// GET /stats/progress?range=weekly|monthly|all&tzOffset=300
// ---------------------------------------------------------------------------
const rangeSchema = z.object({
  range: z.enum(['weekly', 'monthly', 'all']).default('weekly'),
});

async function totals(userId: string, from: Date, to: Date) {
  const [agg, tasks, sessions] = await Promise.all([
    prisma.focusSession.aggregate({
      where: { userId, startedAt: { gte: from, lt: to } },
      _sum: { durationMinutes: true },
    }),
    prisma.task.count({
      where: { userId, status: 'COMPLETED', completedAt: { gte: from, lt: to } },
    }),
    prisma.focusSession.count({
      where: { userId, completed: true, startedAt: { gte: from, lt: to } },
    }),
  ]);
  return { minutes: agg._sum.durationMinutes ?? 0, tasks, sessions };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

router.get('/progress', async (req, res) => {
  const userId = uid(req);
  const { range } = rangeSchema.parse(req.query);
  const off = parseOffset(req.query.tzOffset);
  const now = Date.now();

  // Period + previous period + chart buckets
  let from: number;
  let to: number;
  let prevFrom: number | null = null;
  let prevTo: number | null = null;
  let buckets: { label: string; from: number; to: number }[] = [];

  if (range === 'weekly') {
    from = startOfLocalWeek(now, off);
    to = from + 7 * DAY;
    prevFrom = from - 7 * DAY;
    prevTo = from;
    buckets = WEEKDAY_LABELS.map((label, i) => ({
      label,
      from: from + i * DAY,
      to: from + (i + 1) * DAY,
    }));
  } else if (range === 'monthly') {
    from = startOfLocalMonth(now, off);
    to = startOfLocalMonth(now, off, 1);
    prevFrom = startOfLocalMonth(now, off, -1);
    prevTo = from;
    const weeks = Math.ceil((to - from) / DAY / 7);
    buckets = Array.from({ length: weeks }, (_, i) => ({
      label: `W${i + 1}`,
      from: from + i * 7 * DAY,
      to: Math.min(from + (i + 1) * 7 * DAY, to),
    }));
  } else {
    from = 0;
    to = now + DAY;
    // Chart: the last 6 calendar months.
    buckets = Array.from({ length: 6 }, (_, i) => {
      const delta = i - 5;
      const bFrom = startOfLocalMonth(now, off, delta);
      return { label: monthLabel(bFrom + 12 * 60 * MIN, off), from: bFrom, to: startOfLocalMonth(now, off, delta + 1) };
    });
  }

  const chartFrom = buckets.length > 0 ? buckets[0].from : from;
  const chartTo = buckets.length > 0 ? buckets[buckets.length - 1].to : to;

  const [current, previous, chartSessions, periodSessions, subjects, streak] = await Promise.all([
    totals(userId, new Date(from), new Date(to)),
    prevFrom !== null && prevTo !== null
      ? totals(userId, new Date(prevFrom), new Date(prevTo))
      : Promise.resolve(null),
    prisma.focusSession.findMany({
      where: { userId, startedAt: { gte: new Date(chartFrom), lt: new Date(chartTo) } },
      select: { startedAt: true, durationMinutes: true },
    }),
    prisma.focusSession.groupBy({
      by: ['subjectId'],
      where: { userId, startedAt: { gte: new Date(from), lt: new Date(to) } },
      _sum: { durationMinutes: true },
    }),
    prisma.subject.findMany({
      where: { userId },
      include: { tasks: { select: { status: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    computeStreak(userId, off),
  ]);

  const chart = buckets.map((b) => {
    const minutes = chartSessions
      .filter((s) => {
        const t = s.startedAt.getTime();
        return t >= b.from && t < b.to;
      })
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    return { label: b.label, minutes };
  });

  const minutesBySubject = new Map(periodSessions.map((r) => [r.subjectId, r._sum.durationMinutes ?? 0]));

  const subjectPerformance = subjects
    .map((s) => {
      const total = s.tasks.length;
      const done = s.tasks.filter((t) => t.status === 'COMPLETED').length;
      return {
        id: s.id,
        name: s.name,
        icon: s.icon,
        color: s.color,
        percent: total === 0 ? 0 : Math.round((done / total) * 100),
        minutes: minutesBySubject.get(s.id) ?? 0,
      };
    })
    .sort((a, b) => b.minutes - a.minutes);

  res.json({
    range,
    totalMinutes: current.minutes,
    totalMinutesChange: previous ? pctChange(current.minutes, previous.minutes) : null,
    completedSessions: current.sessions,
    completedSessionsChange: previous ? pctChange(current.sessions, previous.sessions) : null,
    tasksCompleted: current.tasks,
    tasksCompletedChange: previous ? pctChange(current.tasks, previous.tasks) : null,
    streak,
    chart,
    subjects: subjectPerformance,
  });
});

// Exposed for tests / other modules.
export { dayKey };
export default router;
