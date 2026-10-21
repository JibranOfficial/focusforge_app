import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { notFound, badRequest } from '../errors';
import { uid } from '../middleware/auth';
import { publicTask } from '../utils/serialize';
import { DAY, MIN, parseOffset, startOfLocalDay } from '../utils/time';

const router = Router();

const subjectSelect = { select: { id: true, name: true, icon: true, color: true } } as const;

const isoDate = z.coerce.date();

const createSchema = z.object({
  title: z.string().trim().min(1, 'Enter a task name').max(120),
  description: z.string().trim().max(1000).nullable().optional(),
  subjectId: z.string().min(1, 'Choose a subject'),
  scheduledAt: isoDate,
  estimatedMinutes: z.number().int().min(5).max(480).default(25),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  subjectId: z.string().min(1).optional(),
  scheduledAt: isoDate.optional(),
  estimatedMinutes: z.number().int().min(5).max(480).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

async function ownedTask(userId: string, id: string) {
  const task = await prisma.task.findFirst({ where: { id, userId }, include: { subject: subjectSelect } });
  if (!task) throw notFound('Task not found');
  return task;
}

async function assertSubject(userId: string, subjectId: string) {
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
  if (!subject) throw badRequest('Subject not found');
}

// GET /tasks?from=ISO&to=ISO&status=PENDING|COMPLETED&subjectId=
router.get('/', async (req, res) => {
  const query = z
    .object({
      from: isoDate.optional(),
      to: isoDate.optional(),
      status: z.enum(['PENDING', 'COMPLETED']).optional(),
      subjectId: z.string().optional(),
    })
    .parse(req.query);

  const tasks = await prisma.task.findMany({
    where: {
      userId: uid(req),
      status: query.status,
      subjectId: query.subjectId,
      scheduledAt:
        query.from || query.to ? { gte: query.from, lt: query.to } : undefined,
    },
    include: { subject: subjectSelect },
    orderBy: { scheduledAt: 'asc' },
  });

  res.json({ tasks: tasks.map(publicTask) });
});

router.post('/', async (req, res) => {
  const body = createSchema.parse(req.body);
  const userId = uid(req);
  await assertSubject(userId, body.subjectId);

  const task = await prisma.task.create({
    data: { ...body, userId },
    include: { subject: subjectSelect },
  });
  res.status(201).json({ task: publicTask(task) });
});

router.get('/:id', async (req, res) => {
  const task = await ownedTask(uid(req), req.params.id);
  res.json({ task: publicTask(task) });
});

router.patch('/:id', async (req, res) => {
  const userId = uid(req);
  await ownedTask(userId, req.params.id);
  const body = updateSchema.parse(req.body);
  if (body.subjectId) await assertSubject(userId, body.subjectId);

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: body,
    include: { subject: subjectSelect },
  });
  res.json({ task: publicTask(task) });
});

router.post('/:id/complete', async (req, res) => {
  await ownedTask(uid(req), req.params.id);
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { status: 'COMPLETED', progress: 100, completedAt: new Date() },
    include: { subject: subjectSelect },
  });
  res.json({ task: publicTask(task) });
});

router.post('/:id/reopen', async (req, res) => {
  await ownedTask(uid(req), req.params.id);
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { status: 'PENDING', completedAt: null, progress: 0 },
    include: { subject: subjectSelect },
  });
  res.json({ task: publicTask(task) });
});

router.post('/:id/reschedule', async (req, res) => {
  await ownedTask(uid(req), req.params.id);
  const { scheduledAt } = z.object({ scheduledAt: isoDate }).parse(req.body);
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { scheduledAt },
    include: { subject: subjectSelect },
  });
  res.json({ task: publicTask(task) });
});

/**
 * GET /tasks/:id/suggest-time?tzOffset=300
 * Suggests the next free slot: tomorrow at the task's current local hour (or 10:00),
 * moved forward past any task it would overlap.
 */
router.get('/:id/suggest-time', async (req, res) => {
  const userId = uid(req);
  const task = await ownedTask(userId, req.params.id);
  const off = parseOffset(req.query.tzOffset);

  const tomorrowStart = startOfLocalDay(Date.now(), off) + DAY;
  const localMinutesIntoDay = Math.floor(
    (((task.scheduledAt.getTime() + off * MIN) % DAY) + DAY) % DAY / MIN,
  );
  const preferredMinutes = localMinutesIntoDay > 0 ? localMinutesIntoDay : 10 * 60;

  const dayTasks = await prisma.task.findMany({
    where: {
      userId,
      id: { not: task.id },
      status: 'PENDING',
      scheduledAt: { gte: new Date(tomorrowStart), lt: new Date(tomorrowStart + DAY) },
    },
    select: { scheduledAt: true, estimatedMinutes: true },
    orderBy: { scheduledAt: 'asc' },
  });

  let start = tomorrowStart + preferredMinutes * MIN;
  const length = task.estimatedMinutes * MIN;
  for (const other of dayTasks) {
    const otherStart = other.scheduledAt.getTime();
    const otherEnd = otherStart + other.estimatedMinutes * MIN;
    if (start < otherEnd && start + length > otherStart) {
      start = otherEnd;
    }
  }

  res.json({ suggestedAt: new Date(start).toISOString() });
});

router.delete('/:id', async (req, res) => {
  await ownedTask(uid(req), req.params.id);
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
