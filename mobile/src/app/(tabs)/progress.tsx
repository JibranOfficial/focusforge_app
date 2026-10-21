import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { ProgressBar } from '@/components/Progress';
import { Card, Screen, SectionHeader } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { SubjectIcon } from '@/components/SubjectIcon';
import { useProgress } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { formatDuration } from '@/lib/dates';
import { radius, useColors } from '@/theme';
import type { ProgressRange } from '@/types';

const RANGES: { value: ProgressRange; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'all', label: 'All Time' },
];

const CHART_HEIGHT = 150;

/** Picks 4 evenly spaced axis ticks (in minutes) that cover the tallest bar. */
function axisTicks(maxMinutes: number): number[] {
  const steps = [15, 30, 60, 120, 240, 480, 960];
  const step = steps.find((s) => maxMinutes <= s * 4) ?? 1920;
  return [0, 1, 2, 3, 4].map((i) => i * step);
}

function Change({ value }: { value: number | null }) {
  const c = useColors();
  if (value === null) return null;
  const up = value >= 0;
  return (
    <View style={styles.change}>
      <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={12} color={up ? c.accent : c.danger} />
      <AppText variant="caption" style={{ color: up ? c.accent : c.danger, marginLeft: 2 }}>
        {Math.abs(value)}%
      </AppText>
    </View>
  );
}

function StatTile({ label, value, change, children }: { label: string; value: string; change?: number | null; children?: ReactNode }) {
  return (
    <Card style={styles.tile}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <View style={styles.tileValueRow}>
        <AppText variant="h2">{value}</AppText>
        {children}
      </View>
      {change !== undefined ? <Change value={change} /> : <View style={styles.changeSpacer} />}
    </Card>
  );
}

export default function Progress() {
  const router = useRouter();
  const c = useColors();
  const [range, setRange] = useState<ProgressRange>('weekly');
  const q = useProgress(range);
  const data = q.data;

  const maxMinutes = data ? Math.max(0, ...data.chart.map((p) => p.minutes)) : 0;
  const ticks = axisTicks(maxMinutes);
  const top = ticks[ticks.length - 1];

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <AppText variant="h2" style={styles.title}>
        Progress
      </AppText>

      <Segmented options={RANGES} value={range} onChange={setRange} />

      {q.isLoading ? <LoadingState /> : null}
      {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}

      {data ? (
        <>
          <Card style={styles.chartCard}>
            <View style={styles.chartRow}>
              <View style={styles.axis}>
                {[...ticks].reverse().map((t) => (
                  <AppText key={t} variant="caption" tone="muted">
                    {t}
                  </AppText>
                ))}
              </View>
              <View style={styles.plot}>
                {ticks.map((t) => (
                  <View
                    key={t}
                    style={[styles.gridLine, { bottom: (t / top) * CHART_HEIGHT, backgroundColor: c.border }]}
                  />
                ))}
                <View style={styles.bars}>
                  {data.chart.map((p, i) => {
                    const h = top === 0 ? 0 : Math.max(p.minutes > 0 ? 6 : 0, (p.minutes / top) * CHART_HEIGHT);
                    return (
                      <View key={`${p.label}-${i}`} style={styles.barCol}>
                        <View style={[styles.bar, { height: h, backgroundColor: i % 2 === 0 ? c.primary : c.accent }]} />
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
            <View style={styles.labels}>
              <View style={styles.axisSpacer} />
              <View style={styles.labelRow}>
                {data.chart.map((p, i) => (
                  <AppText key={`${p.label}-${i}`} variant="caption" tone="muted" center style={styles.label}>
                    {p.label}
                  </AppText>
                ))}
              </View>
            </View>
            <AppText variant="caption" tone="muted" style={styles.unit}>
              Minutes studied
            </AppText>
          </Card>

          <View style={styles.grid}>
            <StatTile label="Total Study Time" value={formatDuration(data.totalMinutes)} change={data.totalMinutesChange} />
            <StatTile label="Completed Sessions" value={String(data.completedSessions)} change={data.completedSessionsChange} />
            <StatTile label="Tasks Completed" value={String(data.tasksCompleted)} change={data.tasksCompletedChange} />
            <StatTile label="Streak" value={`${data.streak} ${data.streak === 1 ? 'day' : 'days'}`}>
              <Ionicons name="flame" size={20} color={c.warning} style={styles.flame} />
            </StatTile>
          </View>

          <SectionHeader title="Subject Performance" actionLabel="See all" onAction={() => router.push('/(tabs)/subjects')} />
          {data.subjects.length === 0 ? (
            <EmptyState icon="stats-chart-outline" title="No subjects yet" hint="Add subjects and tasks to see your performance." />
          ) : (
            data.subjects.slice(0, 5).map((s) => (
              <Card key={s.id} style={styles.subjectCard}>
                <View style={styles.subjectRow}>
                  <SubjectIcon icon={s.icon} color={s.color} size={34} />
                  <AppText bold style={styles.subjectName}>
                    {s.name}
                  </AppText>
                  <AppText bold tone="accent">
                    {s.percent}%
                  </AppText>
                </View>
                <ProgressBar value={s.percent} color={c.accent} height={6} style={styles.subjectBar} />
              </Card>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 14, marginBottom: 14 },
  chartCard: { marginTop: 16 },
  chartRow: { flexDirection: 'row' },
  axis: { height: CHART_HEIGHT, justifyContent: 'space-between', alignItems: 'flex-end', width: 30, paddingRight: 6 },
  plot: { flex: 1, height: CHART_HEIGHT },
  gridLine: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 14, borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm },
  labels: { flexDirection: 'row', marginTop: 8 },
  axisSpacer: { width: 30 },
  labelRow: { flex: 1, flexDirection: 'row' },
  label: { flex: 1 },
  unit: { marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 14 },
  tile: { width: '48.5%', marginBottom: 12, padding: 14 },
  tileValueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  flame: { marginLeft: 6 },
  change: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  changeSpacer: { height: 16, marginTop: 4 },
  subjectCard: { marginBottom: 10, padding: 14 },
  subjectRow: { flexDirection: 'row', alignItems: 'center' },
  subjectName: { flex: 1, marginLeft: 12 },
  subjectBar: { marginTop: 12 },
});
