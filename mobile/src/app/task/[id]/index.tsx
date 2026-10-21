import { StyleSheet, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/Progress';
import { Card, Screen, ScreenHeader } from '@/components/Screen';
import { ErrorState, LoadingState } from '@/components/States';
import { SubjectIcon } from '@/components/SubjectIcon';
import { useCompleteTask, useDeleteTask, useReopenTask, useTask } from '@/hooks/queries';
import { useStartFocus } from '@/hooks/useStartFocus';
import { errorMessage } from '@/lib/api';
import { formatDateShort, formatTime12 } from '@/lib/dates';
import { useColors } from '@/theme';
import type { Priority } from '@/types';

const PRIORITY_LABEL: Record<Priority, string> = { LOW: 'Low priority', MEDIUM: 'Medium priority', HIGH: 'High priority' };

export default function TaskDetails() {
  const router = useRouter();
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useTask(id);
  const complete = useCompleteTask();
  const reopen = useReopenTask();
  const remove = useDeleteTask();
  const startFocus = useStartFocus();

  const task = q.data;
  const done = task?.status === 'COMPLETED';
  const priorityColor = task?.priority === 'HIGH' ? c.danger : task?.priority === 'LOW' ? c.accent : c.warning;

  const confirmDelete = () => {
    if (!task) return;
    Alert.alert('Delete task', `Delete "${task.title}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(task.id);
            router.back();
          } catch (err) {
            Alert.alert('Could not delete task', errorMessage(err));
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader title="Task Details" />
      {q.isLoading ? <LoadingState /> : null}
      {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}

      {task ? (
        <View style={styles.body}>
          <View style={styles.top}>
            <SubjectIcon icon={task.subject?.icon ?? 'book'} color={task.subject?.color ?? c.primary} size={52} />
            <View style={styles.topText}>
              <AppText variant="h3">{task.subject?.name ?? 'Task'}</AppText>
              <AppText tone="muted">{task.title}</AppText>
            </View>
          </View>

          <Card style={styles.meta}>
            <MetaRow icon="time-outline" text={`${task.estimatedMinutes} minutes`} />
            <MetaRow icon="calendar-outline" text={`${formatDateShort(task.scheduledAt)} · ${formatTime12(task.scheduledAt)}`} />
            <MetaRow
              icon="flag-outline"
              text={PRIORITY_LABEL[task.priority]}
              color={priorityColor}
              last={!task.description}
            />
            {task.description ? <AppText variant="small" tone="muted" style={styles.description}>{task.description}</AppText> : null}
          </Card>

          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <AppText bold>Progress</AppText>
              <AppText bold tone="accent">
                {task.progress}%
              </AppText>
            </View>
            <ProgressBar value={task.progress} color={c.accent} style={styles.progressBar} />
          </Card>

          <View style={styles.actions}>
            {done ? (
              <Button
                title="Mark as Incomplete"
                variant="outline"
                loading={reopen.isPending}
                onPress={() => reopen.mutate(task.id)}
              />
            ) : (
              <>
                <Button title="Mark as Complete" loading={complete.isPending} onPress={() => complete.mutate(task.id)} />
                <Button
                  title="Start Focus Session"
                  variant="outline"
                  onPress={() => startFocus(task)}
                  icon={<Ionicons name="play" size={16} color={c.text} />}
                  style={styles.gap}
                />
              </>
            )}
            <Button
              title="Reschedule"
              variant="outline"
              onPress={() => router.push(`/task/${task.id}/reschedule`)}
              icon={<Ionicons name="calendar-outline" size={17} color={c.text} />}
              style={styles.gap}
            />
            <Button
              title="Delete"
              variant="danger"
              loading={remove.isPending}
              onPress={confirmDelete}
              icon={<Ionicons name="trash-outline" size={17} color={c.danger} />}
              style={styles.gap}
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function MetaRow({ icon, text, color, last }: { icon: keyof typeof Ionicons.glyphMap; text: string; color?: string; last?: boolean }) {
  const c = useColors();
  return (
    <View style={[styles.metaRow, last ? styles.metaLast : null]}>
      <Ionicons name={icon} size={18} color={color ?? c.muted} />
      <AppText style={[styles.metaText, color ? { color } : null]}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 8 },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  topText: { flex: 1, marginLeft: 14 },
  meta: { paddingVertical: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  metaLast: { paddingBottom: 6 },
  metaText: { marginLeft: 12 },
  description: { marginTop: 8, marginBottom: 6 },
  progressCard: { marginTop: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressBar: { marginTop: 12 },
  actions: { marginTop: 22 },
  gap: { marginTop: 10 },
});
