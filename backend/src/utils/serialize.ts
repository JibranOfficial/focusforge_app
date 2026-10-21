import type { Subject, Task, User, UserSettings } from '@prisma/client';

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    xp: user.xp,
    hasPassword: Boolean(user.passwordHash),
    createdAt: user.createdAt,
  };
}

type SubjectLite = Pick<Subject, 'id' | 'name' | 'icon' | 'color'>;

export function publicTask(task: Task & { subject?: SubjectLite }) {
  const endsAt = new Date(task.scheduledAt.getTime() + task.estimatedMinutes * 60_000);
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    subjectId: task.subjectId,
    subject: task.subject
      ? { id: task.subject.id, name: task.subject.name, icon: task.subject.icon, color: task.subject.color }
      : undefined,
    scheduledAt: task.scheduledAt,
    endsAt,
    estimatedMinutes: task.estimatedMinutes,
    priority: task.priority,
    status: task.status,
    progress: task.progress,
    completedAt: task.completedAt,
  };
}

export function publicSettings(s: UserSettings) {
  return {
    darkMode: s.darkMode,
    focusMinutes: s.focusMinutes,
    breakMinutes: s.breakMinutes,
    longBreakMinutes: s.longBreakMinutes,
    sessionsBeforeLongBreak: s.sessionsBeforeLongBreak,
    remindersEnabled: s.remindersEnabled,
    studySessionReminder: s.studySessionReminder,
    taskDeadlineReminder: s.taskDeadlineReminder,
    dailyPlanReminder: s.dailyPlanReminder,
    weeklyReviewReminder: s.weeklyReviewReminder,
    dailyPlanTime: s.dailyPlanTime,
    expoPushToken: s.expoPushToken,
  };
}
