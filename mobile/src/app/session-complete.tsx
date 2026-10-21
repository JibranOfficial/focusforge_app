import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Screen';
import { radius, useColors } from '@/theme';

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <AppText variant="h2" tone={accent ? 'accent' : 'text'}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

export default function SessionComplete() {
  const router = useRouter();
  const c = useColors();
  const { minutes, xp, streak } = useLocalSearchParams<{ minutes?: string; xp?: string; streak?: string }>();

  const streakValue = Number(streak ?? 0);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <Pressable
        style={styles.close}
        hitSlop={12}
        onPress={() => router.replace('/(tabs)/timer')}
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={26} color={c.muted} />
      </Pressable>

      <View style={styles.center}>
        <View style={[styles.trophy, { backgroundColor: c.primarySoft, borderColor: c.primary }]}>
          <Ionicons name="trophy" size={54} color={c.primary} />
        </View>
        <AppText variant="h1" style={styles.title}>
          Great Job!
        </AppText>
        <AppText tone="muted" center>
          You completed a study session!
        </AppText>

        <Card style={styles.stats}>
          <View style={styles.statsRow}>
            <Stat value={minutes ?? '0'} label="minutes" />
            <View style={[styles.sep, { backgroundColor: c.border }]} />
            <Stat value={`+${xp ?? 0}`} label="XP" accent />
            <View style={[styles.sep, { backgroundColor: c.border }]} />
            <Stat value={streakValue > 0 ? String(streakValue) : '–'} label="streak" />
          </View>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button title="Continue" onPress={() => router.replace('/(tabs)/timer')} />
        <Button
          title="View Progress"
          variant="outline"
          onPress={() => router.replace('/(tabs)/progress')}
          style={styles.second}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  close: { alignSelf: 'flex-end', padding: 8, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  trophy: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { marginBottom: 8 },
  stats: { marginTop: 32, alignSelf: 'stretch', borderRadius: radius.lg },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  sep: { width: StyleSheet.hairlineWidth, height: 36 },
  actions: { paddingBottom: 16 },
  second: { marginTop: 10 },
});
