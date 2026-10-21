import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { DateTimeField } from '@/components/DateTimeField';
import { Input } from '@/components/Input';
import { Screen, ScreenHeader } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { SelectField } from '@/components/SelectField';
import { SubjectIcon } from '@/components/SubjectIcon';
import { useCreateTask, useSubjects } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { combineDateAndTime, formatDateShort, formatTime12, isSameDay, startOfDay } from '@/lib/dates';
import { useColors } from '@/theme';
import type { Priority } from '@/types';

const DURATIONS = [15, 25, 30, 45, 60, 90, 120, 180];

function durationLabel(m: number): string {
  if (m >= 60 && m % 60 === 0) return `${m / 60} ${m === 60 ? 'hour' : 'hours'}`;
  return `${m} minutes`;
}

function defaultTime(day: Date): Date {
  const t = new Date(day);
  if (isSameDay(day, new Date())) {
    t.setHours(Math.min(new Date().getHours() + 1, 22), 0, 0, 0);
  } else {
    t.setHours(9, 0, 0, 0);
  }
  return t;
}

export default function NewTask() {
  const router = useRouter();
  const c = useColors();
  const params = useLocalSearchParams<{ date?: string; subjectId?: string }>();
  const subjects = useSubjects();
  const create = useCreateTask();

  const initialDay = startOfDay(params.date ? new Date(params.date) : new Date());

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string | null>(params.subjectId ?? null);
  const [day, setDay] = useState<Date>(initialDay);
  const [time, setTime] = useState<Date>(defaultTime(initialDay));
  const [minutes, setMinutes] = useState(45);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [errors, setErrors] = useState<{ title?: string; subject?: string }>({});

  const save = async () => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = 'Enter a task name';
    if (!subjectId) next.subject = 'Choose a subject';
    setErrors(next);
    if (Object.keys(next).length > 0 || !subjectId) return;

    try {
      await create.mutateAsync({
        title: title.trim(),
        subjectId,
        scheduledAt: combineDateAndTime(day, time).toISOString(),
        estimatedMinutes: minutes,
        priority,
      });
      router.back();
    } catch (err) {
      Alert.alert('Could not save task', errorMessage(err));
    }
  };

  const noSubjects = subjects.data && subjects.data.length === 0;

  return (
    <Screen keyboard>
      <ScreenHeader title="Add Task" />
      <View style={styles.body}>
        <Input
          label="Task Name"
          placeholder="e.g. Chapter 4 – Practice Problems"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          maxLength={120}
        />

        <SelectField
          label="Subject"
          placeholder="Select a subject"
          title="Choose a subject"
          value={subjectId}
          onChange={setSubjectId}
          error={errors.subject}
          emptyText="You have no subjects yet."
          options={(subjects.data ?? []).map((s) => ({
            value: s.id,
            label: s.name,
            leading: <SubjectIcon icon={s.icon} color={s.color} size={30} />,
          }))}
        />
        {noSubjects ? (
          <Button
            title="Create a subject first"
            variant="outline"
            compact
            onPress={() => router.push('/subjects/new')}
            style={styles.createSubject}
          />
        ) : null}

        <View style={styles.pair}>
          <DateTimeField label="Date" mode="date" value={day} onChange={setDay} text={formatDateShort(day)} />
          <View style={styles.gap} />
          <DateTimeField label="Time" mode="time" value={time} onChange={setTime} text={formatTime12(time)} />
        </View>

        <SelectField
          label="Estimated Time"
          icon="time-outline"
          title="Estimated time"
          value={minutes}
          onChange={setMinutes}
          options={DURATIONS.map((m) => ({ value: m, label: durationLabel(m) }))}
        />

        <AppText variant="small" tone="muted" style={styles.priorityLabel}>
          Priority
        </AppText>
        <Segmented
          options={[
            { value: 'LOW' as Priority, label: 'Low' },
            { value: 'MEDIUM' as Priority, label: 'Medium' },
            { value: 'HIGH' as Priority, label: 'High' },
          ]}
          value={priority}
          onChange={setPriority}
        />

        <Button title="Save" onPress={save} loading={create.isPending} style={[styles.save, { shadowColor: c.primary }]} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 12 },
  pair: { flexDirection: 'row' },
  gap: { width: 12 },
  createSubject: { marginTop: -4, marginBottom: 14 },
  priorityLabel: { marginBottom: 6 },
  save: { marginTop: 28 },
});
