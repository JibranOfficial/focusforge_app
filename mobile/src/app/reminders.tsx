import type { ReactNode } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { DateTimeField } from '@/components/DateTimeField';
import { Card, Screen, ScreenHeader } from '@/components/Screen';
import { ErrorState, LoadingState } from '@/components/States';
import { useSettings, useUpdateSettings } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { formatTime12 } from '@/lib/dates';
import { ensureNotificationPermission } from '@/lib/notifications';
import { useColors } from '@/theme';
import type { Settings } from '@/types';

type IconName = keyof typeof Ionicons.glyphMap;

function ReminderRow({
  icon,
  title,
  subtitle,
  value,
  disabled,
  onChange,
  last,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  value: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  const c = useColors();
  return (
    <View
      style={[
        styles.row,
        !last ? { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth } : null,
        { opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: c.primarySoft }]}>
        <Ionicons name={icon} size={19} color={c.primary} />
      </View>
      <View style={styles.rowText}>
        <AppText bold>{title}</AppText>
        <AppText variant="small" tone="muted">
          {subtitle}
        </AppText>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: c.border, true: c.primary }}
        thumbColor={c.white}
      />
    </View>
  );
}

function timeStringToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map((n) => Number(n));
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 8, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function Reminders() {
  const c = useColors();
  const q = useSettings();
  const update = useUpdateSettings();
  const s = q.data;

  const patch = (p: Partial<Settings>) => update.mutate(p, { onError: (err) => Alert.alert('Could not save', errorMessage(err)) });

  const toggleMaster = async (on: boolean) => {
    if (on) {
      const allowed = await ensureNotificationPermission();
      if (!allowed) {
        Alert.alert(
          'Notifications are off',
          'Allow notifications for FocusForge in your phone settings to receive study reminders.',
        );
      }
    }
    patch({ remindersEnabled: on });
  };

  let body: ReactNode = null;
  if (q.isLoading) body = <LoadingState />;
  else if (q.isError) body = <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  else if (s) {
    const off = !s.remindersEnabled;
    body = (
      <>
        <Card style={styles.master}>
          <View style={styles.masterRow}>
            <AppText bold style={styles.rowText}>
              Enable Reminders
            </AppText>
            <Switch
              value={s.remindersEnabled}
              onValueChange={toggleMaster}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.white}
            />
          </View>
        </Card>

        <Card style={styles.list}>
          <ReminderRow
            icon="timer-outline"
            title="Study Session"
            subtitle="10 minutes before"
            value={s.studySessionReminder}
            disabled={off}
            onChange={(v) => patch({ studySessionReminder: v })}
          />
          <ReminderRow
            icon="flag-outline"
            title="Task Deadline"
            subtitle="1 hour before"
            value={s.taskDeadlineReminder}
            disabled={off}
            onChange={(v) => patch({ taskDeadlineReminder: v })}
          />
          <ReminderRow
            icon="calendar-outline"
            title="Daily Plan"
            subtitle={formatTime12(timeStringToDate(s.dailyPlanTime))}
            value={s.dailyPlanReminder}
            disabled={off}
            onChange={(v) => patch({ dailyPlanReminder: v })}
          />
          <ReminderRow
            icon="stats-chart-outline"
            title="Weekly Review"
            subtitle="Sunday, 7:00 PM"
            value={s.weeklyReviewReminder}
            disabled={off}
            onChange={(v) => patch({ weeklyReviewReminder: v })}
            last
          />
        </Card>

        {!off && s.dailyPlanReminder ? (
          <View style={styles.timeField}>
            <DateTimeField
              label="Daily plan time"
              mode="time"
              value={timeStringToDate(s.dailyPlanTime)}
              text={formatTime12(timeStringToDate(s.dailyPlanTime))}
              onChange={(d) => patch({ dailyPlanTime: `${pad(d.getHours())}:${pad(d.getMinutes())}` })}
            />
          </View>
        ) : null}
      </>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Notifications" />
      <AppText variant="h1" style={styles.title}>
        Study Reminders
      </AppText>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 6, marginBottom: 18 },
  master: { paddingVertical: 8, marginBottom: 14 },
  masterRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  list: { paddingVertical: 4, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 66 },
  iconTile: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, marginLeft: 12 },
  timeField: { marginTop: 14 },
});
