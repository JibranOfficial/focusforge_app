import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, useColors } from '@/theme';
import { AppText } from './AppText';
import type { Task } from '@/types';

/** Compact row used in "Today's Tasks": colored status ring, subject, title, chevron. */
export function TaskRow({
  task,
  onPress,
  onToggle,
}: {
  task: Task;
  onPress: () => void;
  onToggle?: () => void;
}) {
  const c = useColors();
  const done = task.status === 'COMPLETED';
  const color = task.subject?.color ?? c.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Pressable hitSlop={10} onPress={onToggle} disabled={!onToggle} accessibilityLabel="Toggle task complete">
        {done ? (
          <View style={[styles.ring, { backgroundColor: color, borderColor: color }]}>
            <Ionicons name="checkmark" size={14} color="#0B1220" />
          </View>
        ) : (
          <View style={[styles.ring, { borderColor: color }]} />
        )}
      </Pressable>
      <View style={styles.body}>
        <AppText bold numberOfLines={1} style={done ? styles.done : null}>
          {task.subject?.name ?? 'Task'}
        </AppText>
        <AppText variant="small" tone="muted" numberOfLines={1}>
          {task.title}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  ring: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, marginHorizontal: 14 },
  done: { textDecorationLine: 'line-through', opacity: 0.7 },
});
