import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { DateTimeField } from '@/components/DateTimeField';
import { Screen, ScreenHeader } from '@/components/Screen';
import { LoadingState } from '@/components/States';
import { useRescheduleTask, useTask } from '@/hooks/queries';
import { api, errorMessage, tzOffset } from '@/lib/api';
import { addDays, combineDateAndTime, formatDateShort, formatTime12, relativeDay, startOfDay } from '@/lib/dates';
import { radius, useColors } from '@/theme';

export default function Reschedule() {
  const router = useRouter();
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useTask(id);
  const reschedule = useRescheduleTask();

  const suggestion = useQuery({
    queryKey: ['suggest-time', id],
    enabled: Boolean(id),
    queryFn: () => api.get<{ suggestedAt: string }>(`/tasks/${id}/suggest-time?tzOffset=${tzOffset()}`),
    staleTime: 0,
  });

  const [choice, setChoice] = useState<'suggested' | 'custom'>('suggested');
  const [customDay, setCustomDay] = useState(() => startOfDay(addDays(new Date(), 1)));
  const [customTime, setCustomTime] = useState(() => {
    const t = new Date();
    t.setHours(10, 0, 0, 0);
    return t;
  });

  // Start the custom picker from the task's current clock time.
  useEffect(() => {
    if (task.data) setCustomTime(new Date(task.data.scheduledAt));
  }, [task.data]);

  const suggestedAt = suggestion.data ? new Date(suggestion.data.suggestedAt) : null;

  const submit = async () => {
    if (!id) return;
    const target = choice === 'suggested' ? suggestedAt : combineDateAndTime(customDay, customTime);
    if (!target) {
      Alert.alert('Pick a time', 'Choose a new time for this task.');
      return;
    }
    try {
      await reschedule.mutateAsync({ id, scheduledAt: target.toISOString() });
      router.back();
    } catch (err) {
      Alert.alert('Could not reschedule', errorMessage(err));
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Reschedule" />
      <AppText tone="muted" style={styles.intro}>
        This task is incomplete. Choose a new time for it, or let FocusForge suggest one.
      </AppText>

      {task.isLoading ? <LoadingState /> : null}

      <Pressable
        onPress={() => setChoice('suggested')}
        style={[
          styles.option,
          { backgroundColor: c.surface, borderColor: choice === 'suggested' ? c.primary : c.border },
        ]}
      >
        <Ionicons name="sparkles-outline" size={22} color={c.primary} />
        <View style={styles.optionText}>
          <AppText variant="caption" tone="muted">
            Suggested Time
          </AppText>
          <AppText bold>
            {suggestedAt ? `${relativeDay(suggestedAt)}, ${formatTime12(suggestedAt)}` : 'Finding a free slot…'}
          </AppText>
        </View>
        {choice === 'suggested' ? <Ionicons name="checkmark-circle" size={22} color={c.primary} /> : null}
      </Pressable>

      <Pressable
        onPress={() => setChoice('custom')}
        style={[
          styles.option,
          { backgroundColor: c.surface, borderColor: choice === 'custom' ? c.primary : c.border },
        ]}
      >
        <Ionicons name="time-outline" size={22} color={c.primary} />
        <View style={styles.optionText}>
          <AppText bold>Custom Time</AppText>
          <AppText variant="small" tone="muted">
            Select date & time
          </AppText>
        </View>
        {choice === 'custom' ? (
          <Ionicons name="checkmark-circle" size={22} color={c.primary} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        )}
      </Pressable>

      {choice === 'custom' ? (
        <View style={styles.pair}>
          <DateTimeField mode="date" value={customDay} onChange={setCustomDay} text={formatDateShort(customDay)} minimumDate={startOfDay(new Date())} />
          <View style={styles.gap} />
          <DateTimeField mode="time" value={customTime} onChange={setCustomTime} text={formatTime12(customTime)} />
        </View>
      ) : null}

      <Button title="Reschedule" onPress={submit} loading={reschedule.isPending} style={styles.submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 6, marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
  },
  optionText: { flex: 1, marginLeft: 14 },
  pair: { flexDirection: 'row', marginTop: 4 },
  gap: { width: 12 },
  submit: { marginTop: 18 },
});
