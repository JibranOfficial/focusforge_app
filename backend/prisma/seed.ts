/**
 * Demo data matching the Figma screens.
 *   Login: alex@example.com / password123
 * Run: npm run seed
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DAY = 86_400_000;

function at(daysFromToday: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const email = 'alex@example.com';
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      name: 'Alex Carter',
      email,
      passwordHash: await bcrypt.hash('password123', 12),
      xp: 120,
      settings: { create: {} },
    },
  });

  const subjectDefs = [
    { name: 'Mathematics', icon: 'calculator', color: '#8B5CF6', topics: ['Algebra', 'Calculus', 'Geometry'] },
    { name: 'Physics', icon: 'rocket', color: '#5EEAD4', topics: ['Mechanics', 'Waves'] },
    { name: 'Computer Science', icon: 'laptop', color: '#60A5FA', topics: ['Algorithms', 'Data structures', 'Databases', 'Networks'] },
    { name: 'English', icon: 'book', color: '#F59E0B', topics: ['Essay writing', 'Literature'] },
  ];

  const subjects: Record<string, string> = {};
  for (const def of subjectDefs) {
    const s = await prisma.subject.create({
      data: {
        userId: user.id,
        name: def.name,
        icon: def.icon,
        color: def.color,
        topics: { create: def.topics.map((name) => ({ name })) },
      },
    });
    subjects[def.name] = s.id;
  }

  const tasks = [
    { s: 'Mathematics', title: 'Chapter 3 – Exercises', at: at(0, 8, 0), mins: 50, status: 'COMPLETED', progress: 100 },
    { s: 'Physics', title: 'Read Chapter 2', at: at(0, 10, 30), mins: 30, status: 'PENDING', progress: 60 },
    { s: 'Computer Science', title: 'Project setup', at: at(0, 13, 0), mins: 50, status: 'PENDING', progress: 0 },
    { s: 'English', title: 'Essay planning', at: at(0, 15, 0), mins: 50, status: 'PENDING', progress: 0 },
    { s: 'Mathematics', title: 'Revision', at: at(0, 18, 0), mins: 30, status: 'PENDING', progress: 0 },
    { s: 'Mathematics', title: 'Chapter 4 – Practice problems', at: at(1, 9, 0), mins: 45, status: 'PENDING', progress: 0 },
    { s: 'Physics', title: 'Lab report draft', at: at(-1, 16, 0), mins: 40, status: 'COMPLETED', progress: 100 },
    { s: 'English', title: 'Read chapter 5', at: at(-2, 11, 0), mins: 30, status: 'COMPLETED', progress: 100 },
  ] as const;

  for (const t of tasks) {
    await prisma.task.create({
      data: {
        userId: user.id,
        subjectId: subjects[t.s],
        title: t.title,
        scheduledAt: t.at,
        estimatedMinutes: t.mins,
        status: t.status,
        progress: t.progress,
        completedAt: t.status === 'COMPLETED' ? t.at : null,
        priority: 'MEDIUM',
      },
    });
  }

  // Focus sessions across the last week (drives the Progress chart + streak).
  const sessionPlan: [number, number, string][] = [
    [0, 50, 'Mathematics'],
    [0, 25, 'Physics'],
    [-1, 40, 'Physics'],
    [-1, 25, 'Computer Science'],
    [-2, 30, 'English'],
    [-2, 45, 'Mathematics'],
    [-3, 25, 'Computer Science'],
    [-4, 50, 'Mathematics'],
    [-5, 30, 'English'],
  ];
  for (const [daysAgo, minutes, subjectName] of sessionPlan) {
    const startedAt = at(daysAgo, 9, 0);
    await prisma.focusSession.create({
      data: {
        userId: user.id,
        subjectId: subjects[subjectName],
        startedAt,
        endedAt: new Date(startedAt.getTime() + minutes * 60_000),
        plannedMinutes: minutes,
        durationMinutes: minutes,
        completed: true,
        xpEarned: Math.round(minutes * 0.4),
      },
    });
  }

  console.log('Seeded demo user alex@example.com / password123');
  void DAY;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
