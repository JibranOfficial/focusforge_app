import { create } from 'zustand';
import { cancelNotification, scheduleTimerAlarm } from '@/lib/notifications';

export type Phase = 'focus' | 'break' | 'longBreak';

export interface TimerTask {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
}

interface TimerState {
  phase: Phase;
  totalSec: number;
  /** Seconds left while paused / idle. While running, derive from endAt instead. */
  remainingSec: number;
  endAt: number | null;
  running: boolean;
  task: TimerTask | null;
  /** When the current focus segment first started (ms). */
  startedAt: number | null;
  /** Focus segments finished in the current Pomodoro cycle. */
  completedFocus: number;
  alarmId: string | null;

  setTask: (task: TimerTask | null) => void;
  /** Re-apply durations from settings while idle. */
  syncDurations: (focusMin: number, breakMin: number, longBreakMin: number) => void;
  start: () => void;
  pause: () => void;
  /** Go back to the start of the current phase (does not record anything). */
  reset: () => void;
  /** Idle timer -> fresh focus phase (used when a new task is chosen). */
  resetToFocus: () => void;
  /** Move to the next phase. `finishedFocus` increments the Pomodoro counter. */
  advance: (opts: { finishedFocus: boolean; sessionsBeforeLong: number }) => void;
}

let durations = { focus: 25 * 60, break: 5 * 60, longBreak: 15 * 60 };

const durationFor = (phase: Phase) =>
  phase === 'focus' ? durations.focus : phase === 'break' ? durations.break : durations.longBreak;

export function remainingNow(s: Pick<TimerState, 'running' | 'endAt' | 'remainingSec'>, now = Date.now()): number {
  if (s.running && s.endAt) return Math.max(0, Math.ceil((s.endAt - now) / 1000));
  return s.remainingSec;
}

export const useTimer = create<TimerState>((set, get) => ({
  phase: 'focus',
  totalSec: durations.focus,
  remainingSec: durations.focus,
  endAt: null,
  running: false,
  task: null,
  startedAt: null,
  completedFocus: 0,
  alarmId: null,

  setTask: (task) => set({ task }),

  syncDurations: (focusMin, breakMin, longBreakMin) => {
    durations = { focus: focusMin * 60, break: breakMin * 60, longBreak: longBreakMin * 60 };
    const s = get();
    if (!s.running && s.remainingSec === s.totalSec) {
      const total = durationFor(s.phase);
      set({ totalSec: total, remainingSec: total });
    }
  },

  start: () => {
    const s = get();
    if (s.running) return;
    const endAt = Date.now() + s.remainingSec * 1000;
    set({
      running: true,
      endAt,
      startedAt: s.phase === 'focus' ? (s.startedAt ?? Date.now()) : s.startedAt,
    });
    const label = s.phase === 'focus' ? 'Focus session complete' : 'Break is over';
    const body = s.phase === 'focus' ? 'Nice work! Time for a break.' : 'Ready for the next focus session?';
    void scheduleTimerAlarm(s.remainingSec, label, body).then((id) => {
      // Only keep the alarm if the timer is still running the same segment.
      if (get().running && get().endAt === endAt) set({ alarmId: id });
      else void cancelNotification(id);
    });
  },

  pause: () => {
    const s = get();
    if (!s.running) return;
    const remaining = remainingNow(s);
    void cancelNotification(s.alarmId);
    set({ running: false, endAt: null, remainingSec: remaining, alarmId: null });
  },

  reset: () => {
    const s = get();
    void cancelNotification(s.alarmId);
    const total = durationFor(s.phase);
    set({
      running: false,
      endAt: null,
      totalSec: total,
      remainingSec: total,
      startedAt: null,
      alarmId: null,
    });
  },

  resetToFocus: () => {
    const s = get();
    if (s.running) return;
    set({
      phase: 'focus',
      totalSec: durations.focus,
      remainingSec: durations.focus,
      endAt: null,
      startedAt: null,
    });
  },

  advance: ({ finishedFocus, sessionsBeforeLong }) => {
    const s = get();
    void cancelNotification(s.alarmId);

    let nextPhase: Phase;
    let completedFocus = s.completedFocus;

    if (s.phase === 'focus') {
      if (finishedFocus) completedFocus += 1;
      if (completedFocus >= sessionsBeforeLong) {
        nextPhase = 'longBreak';
        completedFocus = 0;
      } else {
        nextPhase = 'break';
      }
    } else {
      nextPhase = 'focus';
    }

    const total = durationFor(nextPhase);
    set({
      phase: nextPhase,
      totalSec: total,
      remainingSec: total,
      running: false,
      endAt: null,
      startedAt: null,
      completedFocus,
      alarmId: null,
    });
  },
}));
