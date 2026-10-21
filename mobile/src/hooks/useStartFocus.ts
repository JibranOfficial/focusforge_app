import { Alert } from '@/lib/alert';
import { useRouter } from 'expo-router';
import { useTimer } from '@/store/timer';
import type { Task } from '@/types';

/** Returns a function that loads a task into the focus timer and opens the Timer tab. */
export function useStartFocus() {
  const router = useRouter();

  return (task: Task | null) => {
    const timer = useTimer.getState();

    if (timer.running) {
      Alert.alert('A session is running', 'Pause or finish your current session before starting another.', [
        { text: 'Go to timer', onPress: () => router.push('/(tabs)/timer') },
        { text: 'OK', style: 'cancel' },
      ]);
      return;
    }

    timer.setTask(
      task
        ? {
            id: task.id,
            title: task.title,
            subjectId: task.subjectId,
            subjectName: task.subject?.name ?? 'Study',
          }
        : null,
    );
    timer.resetToFocus();
    router.push('/(tabs)/timer');
  };
}
