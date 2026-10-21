import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { PercentRing } from '@/components/Progress';
import { Card, Screen, SectionHeader } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { SubjectIcon } from '@/components/SubjectIcon';
import { TaskRow } from '@/components/TaskRow';
import { useCompleteTask, useHome, useReopenTask } from '@/hooks/queries';
import { useStartFocus } from '@/hooks/useStartFocus';
import { errorMessage } from '@/lib/api';
import { formatDuration, formatTime12, greeting, relativeDay } from '@/lib/dates';
import { useAuth } from '@/store/auth';
import { useColors } from '@/theme';

export default function Home() {
  const router = useRouter();
  const c = useColors();
  const user = useAuth((s) => s.user);
  const home = useHome();
  const complete = useCompleteTask();
  const reopen = useReopenTask();
  const startFocus = useStartFocus();

  const data = home.data;
  const firstName = (data?.user.name ?? user?.name ?? '').split(' ')[0];
  const next = data?.next ?? null;

  const header = (
    <View style={styles.topBar}>
      <Pressable hitSlop={10} onPress={() => router.push('/(tabs)/settings')} accessibilityLabel="Open settings">
        <Ionicons name="menu" size={26} color={c.text} />
      </Pressable>
      <AppText variant="h3" style={styles.brand}>
        Focus<AppText variant="h3" tone="primary">Forge</AppText>
      </AppText>
      <Pressable onPress={() => router.push('/(tabs)/settings')} accessibilityLabel="Profile">
        <Avatar name={user?.name ?? '?'} uri={user?.avatarUrl} size={34} />
      </Pressable>
    </View>
  );

  return (
    <Screen refreshing={home.isRefetching} onRefresh={() => home.refetch()}>
      {header}

      <AppText variant="h1" style={styles.greeting}>
        {greeting()}
        {firstName ? `, ${firstName}` : ''}
      </AppText>
      <AppText tone="muted" style={styles.sub}>
        Small steps create big results. Keep going!
      </AppText>

      {home.isLoading ? <LoadingState /> : null}
      {home.isError ? <ErrorState message={errorMessage(home.error)} onRetry={() => home.refetch()} /> : null}

      {data ? (
        <>
          <Card style={styles.progressCard}>
            <AppText bold>Today's Progress</AppText>
            <View style={styles.progressRow}>
              <PercentRing value={data.today.percent} size={78} />
              <View style={styles.progressText}>
                <AppText variant="h3">
                  {data.today.sessionsDone} of {data.today.sessionsTotal} sessions
                </AppText>
                <AppText variant="small" tone="muted">
                  {formatDuration(data.today.studiedMinutes)} studied
                </AppText>
              </View>
              {data.streak > 0 ? (
                <View style={[styles.streak, { backgroundColor: c.accentSoft }]}>
                  <Ionicons name="flame" size={14} color={c.warning} />
                  <AppText variant="caption" bold style={styles.streakText}>
                    {data.streak}d
                  </AppText>
                </View>
              ) : null}
            </View>
          </Card>

          <Card style={styles.nextCard}>
            {next ? (
              <>
                <Pressable style={styles.nextRow} onPress={() => router.push(`/task/${next.id}`)}>
                  <SubjectIcon icon={next.subject?.icon ?? 'book'} color={next.subject?.color ?? c.primary} />
                  <View style={styles.nextText}>
                    <AppText variant="small" tone="muted">
                      Next Session
                    </AppText>
                    <AppText bold numberOfLines={1}>
                      {next.subject?.name ?? 'Study'} · {next.title}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {next.estimatedMinutes} minutes · {relativeDay(next.scheduledAt) === 'Today' ? '' : `${relativeDay(next.scheduledAt)}, `}
                      {formatTime12(next.scheduledAt)}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.muted} />
                </Pressable>
                <Button title="Start Focus Session" onPress={() => startFocus(next)} style={styles.startBtn} />
              </>
            ) : (
              <View>
                <AppText bold>No sessions planned</AppText>
                <AppText variant="small" tone="muted" style={styles.noNext}>
                  Add a task to schedule your next study session.
                </AppText>
                <Button title="Add a task" variant="outline" onPress={() => router.push('/task/new')} />
              </View>
            )}
          </Card>

          <SectionHeader title="Today's Tasks" actionLabel="See all" onAction={() => router.push('/(tabs)/plan')} />
          {data.tasks.length === 0 ? (
            <EmptyState title="Nothing scheduled today" hint="Tap + on the Plan tab to add a task." />
          ) : (
            data.tasks.slice(0, 5).map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onPress={() => router.push(`/task/${task.id}`)}
                onToggle={() => (task.status === 'COMPLETED' ? reopen.mutate(task.id) : complete.mutate(task.id))}
              />
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52 },
  brand: { letterSpacing: 0.2 },
  greeting: { marginTop: 8 },
  sub: { marginTop: 6, marginBottom: 18 },
  progressCard: { marginBottom: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  progressText: { flex: 1, marginLeft: 16 },
  streak: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  streakText: { marginLeft: 3 },
  nextCard: { marginBottom: 4 },
  nextRow: { flexDirection: 'row', alignItems: 'center' },
  nextText: { flex: 1, marginHorizontal: 12 },
  startBtn: { marginTop: 14 },
  noNext: { marginTop: 4, marginBottom: 12 },
});
