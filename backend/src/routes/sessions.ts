import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { badRequest } from '../errors';
import { uid } from '../middleware/auth';
import { computeStreak } from '../utils/streak';
import { parseOffset } from '../utils/time';

const router = Router();

const createSchema = z.object({
  taskId: z.string().optional(),
  subjectId: z.string().optional(),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().optional(),
  plannedMinutes: z.number().int().min(1).max(480),
  durationMinutes: z.number().int().min(0).max(480),
  completed: z.boolean().default(true),
  /** Mark the linked task as done when the session finishes. */
  completeTask: z.boolean().default(false),
  tzOffset: z.number().optional(),
});

/** 25 focused minutes = 10 XP. Unfinished sessions earn nothing. */
export function xpFor(durationMinutes: number, completed: boolean): number {
  return completed ? Math.round(durationMinutes * 0.4) : 0;
}

router.post('/', async (req, res) => {
  const userId = uid(req);
  const body = createSchema.parse(req.body);

  let subjectId = body.subjectId;
  if (body.taskId) {
    const task = await prisma.task.findFirst({ where: { id: body.taskId, userId } });
    if (!task) throw badRequest('Task not found');
    subjectId = subjectId ?? task.subjectId;
  }
  if (subjectId) {
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
    if (!subject) throw badRequest('Subject not found');
  }

  const xpEarned = xpFor(body.durationMinutes, body.completed);

  const [session, user] = await prisma.$transaction([
    prisma.focusSession.create({
      data: {
        userId,
        taskId: body.taskId,
        subjectId,
        startedAt: body.startedAt,
        endedAt: body.endedAt ?? new Date(),
        plannedMinutes: body.plannedMinutes,
        durationMinutes: body.durationMinutes,
        completed: body.completed,
        xpEarned,
      },
    }),
    prisma.user.update({ where: { id: userId }, data: { xp: { increment: xpEarned } } }),
  ]);

  if (body.taskId && body.completed) {
    if (body.completeTask) {
      await prisma.task.update({
        where: { id: body.taskId },
        data: { status: 'COMPLETED', progress: 100, completedAt: new Date() },
      });
    } else {
      // Advance progress by the share of the estimate that was just studied.
      const task = await prisma.task.findUnique({ where: { id: body.taskId } });
      if (task && task.status === 'PENDING') {
        const gained = Math.round((body.durationMinutes / Math.max(task.estimatedMinutes, 1)) * 100);
        await prisma.task.update({
          where: { id: task.id },
          data: { progress: Math.min(99, task.progress + gained) },
        });
      }
    }
  }

  const streak = await computeStreak(userId, parseOffset(body.tzOffset));

  res.status(201).json({
    session: {
      id: session.id,
      durationMinutes: session.durationMinutes,
      completed: session.completed,
    },
    xpEarned,
    totalXp: user.xp,
    streak,
  });
});

router.get('/', async (req, res) => {
  const query = z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
    })
    .parse(req.query);

  const sessions = await prisma.focusSession.findMany({
    where: {
      userId: uid(req),
      startedAt: query.from || query.to ? { gte: query.from, lt: query.to } : undefined,
    },
    orderBy: { startedAt: 'desc' },
    take: query.limit,
    include: { subject: { select: { id: true, name: true, color: true } } },
  });

  res.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      plannedMinutes: s.plannedMinutes,
      durationMinutes: s.durationMinutes,
      completed: s.completed,
      xpEarned: s.xpEarned,
      subject: s.subject,
      taskId: s.taskId,
    })),
  });
});

export default router;
