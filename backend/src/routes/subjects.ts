import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { notFound } from '../errors';
import { uid } from '../middleware/auth';

const router = Router();

const subjectSchema = z.object({
  name: z.string().trim().min(1, 'Enter a subject name').max(60),
  icon: z.string().trim().min(1).max(40).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #8B5CF6')
    .optional(),
});

type SubjectWithCounts = {
  id: string;
  name: string;
  icon: string;
  color: string;
  topics: { done: boolean }[];
  tasks: { status: 'PENDING' | 'COMPLETED' }[];
};

function present(s: SubjectWithCounts) {
  const tasksCount = s.tasks.length;
  const completedTasks = s.tasks.filter((t) => t.status === 'COMPLETED').length;
  return {
    id: s.id,
    name: s.name,
    icon: s.icon,
    color: s.color,
    topicsCount: s.topics.length,
    tasksCount,
    completedTasks,
    progress: tasksCount === 0 ? 0 : Math.round((completedTasks / tasksCount) * 100),
  };
}

const include = {
  topics: { select: { done: true } },
  tasks: { select: { status: true } },
} as const;

router.get('/', async (req, res) => {
  const subjects = await prisma.subject.findMany({
    where: { userId: uid(req) },
    include,
    orderBy: { createdAt: 'asc' },
  });
  res.json({ subjects: subjects.map(present) });
});

router.post('/', async (req, res) => {
  const body = subjectSchema.parse(req.body);
  const subject = await prisma.subject.create({
    data: { ...body, userId: uid(req) },
    include,
  });
  res.status(201).json({ subject: present(subject) });
});

async function ownedSubject(userId: string, id: string) {
  const subject = await prisma.subject.findFirst({ where: { id, userId } });
  if (!subject) throw notFound('Subject not found');
  return subject;
}

router.get('/:id', async (req, res) => {
  await ownedSubject(uid(req), req.params.id);
  const subject = await prisma.subject.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { ...include, topics: true },
  });
  res.json({
    subject: {
      ...present(subject),
      topics: subject.topics.map((t) => ({ id: t.id, name: t.name, done: t.done })),
    },
  });
});

router.patch('/:id', async (req, res) => {
  await ownedSubject(uid(req), req.params.id);
  const body = subjectSchema.partial().parse(req.body);
  const subject = await prisma.subject.update({
    where: { id: req.params.id },
    data: body,
    include,
  });
  res.json({ subject: present(subject) });
});

router.delete('/:id', async (req, res) => {
  await ownedSubject(uid(req), req.params.id);
  await prisma.subject.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ---- Topics ----

const topicSchema = z.object({
  name: z.string().trim().min(1).max(100),
  done: z.boolean().optional(),
});

router.post('/:id/topics', async (req, res) => {
  await ownedSubject(uid(req), req.params.id);
  const body = topicSchema.parse(req.body);
  const topic = await prisma.topic.create({ data: { ...body, subjectId: req.params.id } });
  res.status(201).json({ topic: { id: topic.id, name: topic.name, done: topic.done } });
});

router.patch('/:id/topics/:topicId', async (req, res) => {
  await ownedSubject(uid(req), req.params.id);
  const body = topicSchema.partial().parse(req.body);
  const existing = await prisma.topic.findFirst({
    where: { id: req.params.topicId, subjectId: req.params.id },
  });
  if (!existing) throw notFound('Topic not found');
  const topic = await prisma.topic.update({ where: { id: existing.id }, data: body });
  res.json({ topic: { id: topic.id, name: topic.name, done: topic.done } });
});

router.delete('/:id/topics/:topicId', async (req, res) => {
  await ownedSubject(uid(req), req.params.id);
  const existing = await prisma.topic.findFirst({
    where: { id: req.params.topicId, subjectId: req.params.id },
  });
  if (!existing) throw notFound('Topic not found');
  await prisma.topic.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

export default router;
