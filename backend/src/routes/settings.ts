import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { uid } from '../middleware/auth';
import { publicSettings } from '../utils/serialize';

const router = Router();

const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM (24h)');

const updateSchema = z.object({
  darkMode: z.boolean().optional(),
  focusMinutes: z.number().int().min(1).max(180).optional(),
  breakMinutes: z.number().int().min(1).max(60).optional(),
  longBreakMinutes: z.number().int().min(1).max(120).optional(),
  sessionsBeforeLongBreak: z.number().int().min(1).max(12).optional(),
  remindersEnabled: z.boolean().optional(),
  studySessionReminder: z.boolean().optional(),
  taskDeadlineReminder: z.boolean().optional(),
  dailyPlanReminder: z.boolean().optional(),
  weeklyReviewReminder: z.boolean().optional(),
  dailyPlanTime: timeString.optional(),
  expoPushToken: z.string().max(200).nullable().optional(),
});

router.get('/', async (req, res) => {
  const userId = uid(req);
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  res.json({ settings: publicSettings(settings) });
});

router.put('/', async (req, res) => {
  const userId = uid(req);
  const body = updateSchema.parse(req.body);
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: body,
    create: { userId, ...body },
  });
  res.json({ settings: publicSettings(settings) });
});

export default router;
