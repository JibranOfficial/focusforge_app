export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'PENDING' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  xp: number;
  hasPassword: boolean;
  createdAt: string;
}

export interface SubjectLite {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  subjectId: string;
  subject?: SubjectLite;
  scheduledAt: string;
  endsAt: string;
  estimatedMinutes: number;
  priority: Priority;
  status: TaskStatus;
  progress: number;
  completedAt: string | null;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  topicsCount: number;
  tasksCount: number;
  completedTasks: number;
  progress: number;
}

export interface Topic {
  id: string;
  name: string;
  done: boolean;
}

export interface SubjectDetail extends Subject {
  topics: Topic[];
}

export interface Settings {
  darkMode: boolean;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  remindersEnabled: boolean;
  studySessionReminder: boolean;
  taskDeadlineReminder: boolean;
  dailyPlanReminder: boolean;
  weeklyReviewReminder: boolean;
  dailyPlanTime: string;
  expoPushToken: string | null;
}

export interface HomeData {
  user: { name: string; xp: number };
  today: {
    percent: number;
    sessionsDone: number;
    sessionsTotal: number;
    studiedMinutes: number;
    plannedMinutes: number;
  };
  streak: number;
  next: Task | null;
  tasks: Task[];
}

export type ProgressRange = 'weekly' | 'monthly' | 'all';

export interface ProgressData {
  range: ProgressRange;
  totalMinutes: number;
  totalMinutesChange: number | null;
  completedSessions: number;
  completedSessionsChange: number | null;
  tasksCompleted: number;
  tasksCompletedChange: number | null;
  streak: number;
  chart: { label: string; minutes: number }[];
  subjects: { id: string; name: string; icon: string; color: string; percent: number; minutes: number }[];
}

export interface SessionResult {
  session: { id: string; durationMinutes: number; completed: boolean };
  xpEarned: number;
  totalXp: number;
  streak: number;
}
