import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { ProgressBar } from '@/components/Progress';
import { Card, Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { SubjectIcon } from '@/components/SubjectIcon';
import { useSubjects } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { radius, useColors } from '@/theme';

export default function Subjects() {
  const router = useRouter();
  const c = useColors();
  const q = useSubjects();

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <AppText variant="h2" style={styles.title}>
        Subjects
      </AppText>

      {q.isLoading ? <LoadingState /> : null}
      {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}

      {q.data && q.data.length === 0 ? (
        <EmptyState icon="library-outline" title="No subjects yet" hint="Add your first subject to start planning." />
      ) : null}

      {q.data?.map((s) => (
        <Card key={s.id} style={styles.card} onPress={() => router.push(`/subjects/${s.id}`)}>
          <View style={styles.row}>
            <SubjectIcon icon={s.icon} color={s.color} size={48} />
            <View style={styles.info}>
              <AppText variant="h3">{s.name}</AppText>
              <AppText variant="small" tone="muted">
                {s.topicsCount} {s.topicsCount === 1 ? 'topic' : 'topics'} · {s.tasksCount}{' '}
                {s.tasksCount === 1 ? 'task' : 'tasks'}
              </AppText>
            </View>
            <AppText bold tone="muted">
              {s.progress}%
            </AppText>
          </View>
          <ProgressBar value={s.progress} color={c.accent} style={styles.bar} />
        </Card>
      ))}

      <Pressable
        onPress={() => router.push('/subjects/new')}
        style={[styles.add, { borderColor: c.primary }]}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={20} color={c.primary} />
        <AppText tone="primary" bold style={styles.addText}>
          Add Subject
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 14, marginBottom: 16 },
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginHorizontal: 14 },
  bar: { marginTop: 14 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  addText: { marginLeft: 6 },
});
