import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { useCompleteTask, useReopenTask, useTasksRange } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { addDays, dayShortName, formatDayLong, formatTime24, isSameDay, startOfDay, startOfWeek } from '@/lib/dates';
import { radius, useColors } from '@/theme';
import type { Task } from '@/types';

export default function Plan() {
  const router = useRouter();
  const c = useColors();
  const [selected, setSelected] = useState(() => startOfDay(new Date()));

  const weekStart = useMemo(() => startOfWeek(selected), [selected]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const tasksQuery = useTasksRange(weekStart, addDays(weekStart, 7));
  const complete = useCompleteTask();
  const reopen = useReopenTask();

  const weekTasks = tasksQuery.data ?? [];
  const dayTasks = weekTasks.filter((t) => isSameDay(t.scheduledAt, selected));
  const today = startOfDay(new Date());

  const toggle = (task: Task) =>
    task.status === 'COMPLETED' ? reopen.mutate(task.id) : complete.mutate(task.id);

  const fab = (
    <Pressable
      accessibilityLabel="Add task"
      onPress={() => router.push(`/task/new?date=${encodeURIComponent(selected.toISOString())}`)}
      style={[styles.fab, { backgroundColor: c.primary }]}
    >
      <Ionicons name="add" size={30} color={c.white} />
    </Pressable>
  );

  return (
    <Screen
      refreshing={tasksQuery.isRefetching}
      onRefresh={() => tasksQuery.refetch()}
      footer={fab}
      contentStyle={styles.content}
    >
      <AppText variant="h2" style={styles.title}>
        Study Plan
      </AppText>

      <View style={styles.dateNav}>
        <Pressable hitSlop={12} onPress={() => setSelected(addDays(selected, -1))} accessibilityLabel="Previous day">
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </Pressable>
        <Pressable onPress={() => setSelected(today)}>
          <AppText variant="h3">{formatDayLong(selected)}</AppText>
        </Pressable>
        <Pressable hitSlop={12} onPress={() => setSelected(addDays(selected, 1))} accessibilityLabel="Next day">
          <Ionicons name="chevron-forward" size={22} color={c.text} />
        </Pressable>
      </View>

      <View style={styles.week}>
        {days.map((d) => {
          const active = isSameDay(d, selected);
          const isToday = isSameDay(d, today);
          const hasTasks = weekTasks.some((t) => isSameDay(t.scheduledAt, d));
          return (
            <Pressable
              key={d.toISOString()}
              onPress={() => setSelected(d)}
              style={[
                styles.day,
                { backgroundColor: active ? c.primary : c.surface, borderColor: isToday && !active ? c.accent : c.border },
              ]}
            >
              <AppText variant="caption" tone={active ? 'white' : 'muted'}>
                {dayShortName(d)}
              </AppText>
              <AppText bold tone={active ? 'white' : 'text'}>
                {d.getDate()}
              </AppText>
              <View style={[styles.dot, { backgroundColor: hasTasks ? (active ? c.white : c.accent) : 'transparent' }]} />
            </Pressable>
          );
        })}
      </View>

      {tasksQuery.isLoading ? <LoadingState /> : null}
      {tasksQuery.isError ? (
        <ErrorState message={errorMessage(tasksQuery.error)} onRetry={() => tasksQuery.refetch()} />
      ) : null}

      {!tasksQuery.isLoading && !tasksQuery.isError && dayTasks.length === 0 ? (
        <EmptyState icon="calendar-clear-outline" title="Nothing planned" hint="Tap + to add a study task for this day." />
      ) : null}

      {dayTasks.map((task) => {
        const done = task.status === 'COMPLETED';
        const color = task.subject?.color ?? c.primary;
        return (
          <Pressable
            key={task.id}
            onPress={() => router.push(`/task/${task.id}`)}
            style={({ pressed }) => [
              styles.item,
              { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.bar, { backgroundColor: color }]} />
            <View style={styles.itemBody}>
              <AppText variant="caption" tone="muted">
                {formatTime24(task.scheduledAt)} – {formatTime24(task.endsAt)}
              </AppText>
              <AppText bold numberOfLines={1} style={done ? styles.done : null}>
                {task.subject?.name ?? 'Task'}
              </AppText>
              <AppText variant="small" tone="muted" numberOfLines={1}>
                {task.title}
              </AppText>
            </View>
            <Pressable hitSlop={12} onPress={() => toggle(task)} accessibilityLabel="Toggle task complete">
              {done ? (
                <Ionicons name="checkmark-circle" size={26} color={c.accent} />
              ) : (
                <View style={[styles.circle, { borderColor: c.border }]} />
              )}
            </Pressable>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 110 },
  title: { marginTop: 14 },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  day: {
    width: 44,
    height: 66,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  itemBody: { flex: 1, marginLeft: 12, marginRight: 8 },
  done: { textDecorationLine: 'line-through', opacity: 0.7 },
  circle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
