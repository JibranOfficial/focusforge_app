import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ProgressRing } from '@/components/Progress';
import { Card, Screen, ScreenHeader } from '@/components/Screen';
import { useHome, useRecordSession, useSettings, useUpdateSettings } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { formatClock } from '@/lib/dates';
import { remainingNow, useTimer } from '@/store/timer';
import { radius, useColors } from '@/theme';

const KEEP_AWAKE_TAG = 'focusforge-timer';

const PHASE_LABEL = { focus: 'Focus', break: 'Short Break', longBreak: 'Long Break' } as const;

export default function TimerScreen() {
  const router = useRouter();
  const c = useColors();
  const timer = useTimer();
  const settingsQuery = useSettings();
  const settings = settingsQuery.data;
  const home = useHome();
  const record = useRecordSession();
  const updateSettings = useUpdateSettings();

  const [now, setNow] = useState(Date.now());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const finishing = useRef(false);

  const sessionsBeforeLong = settings?.sessionsBeforeLongBreak ?? 4;

  // Re-render a few times a second while the clock is running.
  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer.running]);

  // Keep the screen on during a session.
  useEffect(() => {
    if (timer.running) void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    else void deactivateKeepAwake(KEEP_AWAKE_TAG);
    return () => {
      void deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [timer.running]);

  const remaining = remainingNow(timer, now);
  const elapsed = timer.totalSec - remaining;
  const progress = timer.totalSec === 0 ? 0 : elapsed / timer.totalSec;

  const recordPartial = async () => {
    const s = useTimer.getState();
    if (s.phase !== 'focus') return;
    const elapsedSec = s.totalSec - remainingNow(s);
    const minutes = Math.floor(elapsedSec / 60);
    if (minutes < 1) return;
    try {
      await record.mutateAsync({
        taskId: s.task?.id,
        subjectId: s.task?.subjectId,
        startedAt: new Date(s.startedAt ?? Date.now() - elapsedSec * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        plannedMinutes: Math.round(s.totalSec / 60),
        durationMinutes: minutes,
        completed: false,
      });
    } catch {
      // A partial session that can't be saved isn't worth interrupting the user for.
    }
  };

  const finishPhase = async () => {
    if (finishing.current) return;
    finishing.current = true;
    try {
      const s = useTimer.getState();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      if (s.phase === 'focus') {
        const minutes = Math.round(s.totalSec / 60);
        let xp = Math.round(minutes * 0.4);
        let streak = 0;
        try {
          const res = await record.mutateAsync({
            taskId: s.task?.id,
            subjectId: s.task?.subjectId,
            startedAt: new Date(s.startedAt ?? Date.now() - s.totalSec * 1000).toISOString(),
            endedAt: new Date().toISOString(),
            plannedMinutes: minutes,
            durationMinutes: minutes,
            completed: true,
          });
          xp = res.xpEarned;
          streak = res.streak;
        } catch (err) {
          Alert.alert('Session finished', `Nice work, but it could not be saved: ${errorMessage(err)}`);
        }
        useTimer.getState().advance({ finishedFocus: true, sessionsBeforeLong });
        router.push({
          pathname: '/session-complete',
          params: { minutes: String(minutes), xp: String(xp), streak: String(streak) },
        });
      } else {
        useTimer.getState().advance({ finishedFocus: false, sessionsBeforeLong });
      }
    } finally {
      finishing.current = false;
    }
  };

  // Phase reached zero.
  useEffect(() => {
    if (timer.running && remaining <= 0) void finishPhase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.running, remaining]);

  const onReset = async () => {
    await recordPartial();
    timer.reset();
  };

  const onSkip = async () => {
    await recordPartial();
    useTimer.getState().advance({ finishedFocus: false, sessionsBeforeLong });
  };

  const pendingToday = (home.data?.tasks ?? []).filter((t) => t.status === 'PENDING');

  return (
    <Screen
      scroll={false}
      padded={false}
      contentStyle={styles.screen}
    >
      <ScreenHeader
        title="Focus Timer"
        hideBack
        right={
          <Pressable hitSlop={10} onPress={() => setSettingsOpen(true)} accessibilityLabel="Session settings">
            <Ionicons name="settings-outline" size={22} color={c.text} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => (timer.running ? undefined : setPickerOpen(true))}
          style={styles.taskBlock}
          accessibilityLabel="Choose task"
        >
          <View style={styles.taskTitleRow}>
            <AppText variant="h3" center>
              {timer.task?.subjectName ?? 'Free focus'}
            </AppText>
            {!timer.running ? <Ionicons name="chevron-down" size={16} color={c.muted} style={styles.caret} /> : null}
          </View>
          <AppText variant="small" tone="muted" center>
            {timer.task?.title ?? 'Tap to choose a task'}
          </AppText>
        </Pressable>

        <View style={styles.ringWrap}>
          <ProgressRing size={270} strokeWidth={12} progress={progress} gradient>
            <AppText style={styles.clock}>{formatClock(remaining)}</AppText>
            <AppText tone="muted">{PHASE_LABEL[timer.phase]}</AppText>
          </ProgressRing>
        </View>

        <View style={styles.controls}>
          <View style={styles.controlCol}>
            <Pressable onPress={onReset} style={[styles.smallBtn, { borderColor: c.border, backgroundColor: c.surface }]} accessibilityLabel="Reset">
              <Ionicons name="refresh" size={22} color={c.text} />
            </Pressable>
            <AppText variant="caption" tone="muted" style={styles.controlLabel}>
              Reset
            </AppText>
          </View>

          <Pressable
            onPress={() => (timer.running ? timer.pause() : timer.start())}
            style={[styles.bigBtn, { backgroundColor: c.primary }]}
            accessibilityLabel={timer.running ? 'Pause' : 'Start'}
          >
            <Ionicons name={timer.running ? 'pause' : 'play'} size={34} color={c.white} style={timer.running ? undefined : styles.playIcon} />
          </Pressable>

          <View style={styles.controlCol}>
            <Pressable onPress={onSkip} style={[styles.smallBtn, { borderColor: c.border, backgroundColor: c.surface }]} accessibilityLabel="Skip">
              <Ionicons name="play-skip-forward" size={22} color={c.text} />
            </Pressable>
            <AppText variant="caption" tone="muted" style={styles.controlLabel}>
              Skip
            </AppText>
          </View>
        </View>

        <Card onPress={() => setSettingsOpen(true)} style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <View style={[styles.gearTile, { backgroundColor: c.primarySoft }]}>
              <Ionicons name="options-outline" size={20} color={c.primary} />
            </View>
            <View style={styles.settingsText}>
              <AppText bold>Session Settings</AppText>
              <AppText variant="small" tone="muted">
                Pomodoro ({settings?.focusMinutes ?? 25}/{settings?.breakMinutes ?? 5})
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.muted} />
          </View>
        </Card>
      </ScrollView>

      {/* Task picker */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={[styles.flex, { backgroundColor: c.overlay }]} onPress={() => setPickerOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.grabber, { backgroundColor: c.border }]} />
          <AppText variant="h3" style={styles.sheetTitle}>
            What are you focusing on?
          </AppText>
          <ScrollView style={styles.sheetList}>
            <Pressable
              style={styles.option}
              onPress={() => {
                timer.setTask(null);
                setPickerOpen(false);
              }}
            >
              <AppText style={styles.flex}>Free focus (no task)</AppText>
              {!timer.task ? <Ionicons name="checkmark" size={20} color={c.primary} /> : null}
            </Pressable>
            {pendingToday.map((t) => (
              <Pressable
                key={t.id}
                style={styles.option}
                onPress={() => {
                  timer.setTask({
                    id: t.id,
                    title: t.title,
                    subjectId: t.subjectId,
                    subjectName: t.subject?.name ?? 'Study',
                  });
                  setPickerOpen(false);
                }}
              >
                <View style={styles.flex}>
                  <AppText bold>{t.subject?.name ?? 'Study'}</AppText>
                  <AppText variant="small" tone="muted">
                    {t.title}
                  </AppText>
                </View>
                {timer.task?.id === t.id ? <Ionicons name="checkmark" size={20} color={c.primary} /> : null}
              </Pressable>
            ))}
            {pendingToday.length === 0 ? (
              <AppText variant="small" tone="muted" style={styles.emptyPick}>
                No pending tasks for today. Add one from the Plan tab, or just start a free focus session.
              </AppText>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      {/* Pomodoro settings */}
      <SessionSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        locked={timer.running}
        focus={settings?.focusMinutes ?? 25}
        brk={settings?.breakMinutes ?? 5}
        longBrk={settings?.longBreakMinutes ?? 15}
        onSave={(focusMinutes, breakMinutes, longBreakMinutes) => {
          updateSettings.mutate({ focusMinutes, breakMinutes, longBreakMinutes });
          timer.syncDurations(focusMinutes, breakMinutes, longBreakMinutes);
          timer.reset();
          setSettingsOpen(false);
        }}
      />
    </Screen>
  );
}

function Stepper({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  const c = useColors();
  return (
    <View style={styles.stepper}>
      <AppText style={styles.flex}>{label}</AppText>
      <Pressable
        onPress={() => onChange(Math.max(min, value - step))}
        style={[styles.stepBtn, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}
        accessibilityLabel={`Decrease ${label}`}
      >
        <Ionicons name="remove" size={18} color={c.text} />
      </Pressable>
      <AppText bold center style={styles.stepValue}>
        {value} min
      </AppText>
      <Pressable
        onPress={() => onChange(Math.min(max, value + step))}
        style={[styles.stepBtn, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}
        accessibilityLabel={`Increase ${label}`}
      >
        <Ionicons name="add" size={18} color={c.text} />
      </Pressable>
    </View>
  );
}

function SessionSettingsModal({
  visible,
  onClose,
  locked,
  focus,
  brk,
  longBrk,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  locked: boolean;
  focus: number;
  brk: number;
  longBrk: number;
  onSave: (focus: number, brk: number, longBrk: number) => void;
}) {
  const c = useColors();
  const [f, setF] = useState(focus);
  const [b, setB] = useState(brk);
  const [l, setL] = useState(longBrk);

  // Reload the current values each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setF(focus);
      setB(brk);
      setL(longBrk);
    }
  }, [visible, focus, brk, longBrk]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.flex, { backgroundColor: c.overlay }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={[styles.grabber, { backgroundColor: c.border }]} />
        <AppText variant="h3" style={styles.sheetTitle}>
          Session Settings
        </AppText>
        {locked ? (
          <AppText variant="small" tone="muted" style={styles.lockedNote}>
            Pause the timer to change durations.
          </AppText>
        ) : null}
        <Stepper label="Focus" value={f} min={5} max={90} step={5} onChange={setF} />
        <Stepper label="Short break" value={b} min={1} max={30} onChange={setB} />
        <Stepper label="Long break" value={l} min={5} max={60} step={5} onChange={setL} />
        <Button title="Save" onPress={() => onSave(f, b, l)} disabled={locked} style={styles.saveBtn} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32, alignItems: 'stretch' },
  taskBlock: { alignItems: 'center', marginTop: 4 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center' },
  caret: { marginLeft: 4 },
  ringWrap: { alignItems: 'center', marginVertical: 28 },
  clock: { fontFamily: 'Inter_700Bold', fontSize: 52, lineHeight: 60 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', marginBottom: 28 },
  controlCol: { alignItems: 'center', width: 72 },
  controlLabel: { marginTop: 6 },
  smallBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bigBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  playIcon: { marginLeft: 4 },
  settingsCard: { padding: 14 },
  settingsRow: { flexDirection: 'row', alignItems: 'center' },
  gearTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingsText: { flex: 1, marginLeft: 12 },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: 10 },
  sheetTitle: { marginBottom: 8, marginLeft: 4 },
  sheetList: { flexGrow: 0 },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 54, paddingHorizontal: 12 },
  emptyPick: { padding: 12 },
  lockedNote: { marginLeft: 4, marginBottom: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 4 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepValue: { width: 74 },
  saveBtn: { marginTop: 16 },
});
