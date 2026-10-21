import { useRef, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { NightScene } from '@/components/NightScene';
import { markOnboarded } from '@/lib/onboarding';
import { useColors } from '@/theme';

const SLIDES = [
  {
    title: 'Build better\nstudy habits',
    body: 'Organize your goals, create study plans and stay on track — one session at a time.',
  },
  {
    title: 'Plan every\nstudy day',
    body: 'Schedule tasks by subject, set priorities and see your whole week at a glance.',
  },
  {
    title: 'Focus deeper\nwith Pomodoro',
    body: 'Work in focused sprints with built-in breaks, and earn XP for every session you finish.',
  },
  {
    title: 'Watch your\nprogress grow',
    body: 'Track study time, streaks and subject performance with clear weekly insights.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const c = useColors();
  const dims = useWindowDimensions();
  // On the web the app is a 480px-wide column, so page the slides by that width.
  const width = Platform.OS === 'web' ? Math.min(dims.width, 480) : dims.width;
  const height = dims.height;
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const go = async (path: '/signup' | '/login') => {
    await markOnboarded();
    router.replace(path);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={StyleSheet.absoluteFill}>
        <NightScene width={width} height={height} />
        <View style={[StyleSheet.absoluteFill, styles.shade]} />
      </View>

      <SafeAreaView style={styles.bottom} edges={['bottom']}>
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(s) => s.title}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <AppText variant="h1" tone="white" style={styles.title}>
                {item.title}
              </AppText>
              <AppText tone="white" style={styles.body}>
                {item.body}
              </AppText>
            </View>
          )}
        />

        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.title}
              style={[
                styles.dot,
                { backgroundColor: i === index ? c.accent : 'rgba(255,255,255,0.3)', width: i === index ? 18 : 7 },
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Button title="Get Started" onPress={() => go('/signup')} />
          <Pressable onPress={() => go('/login')} hitSlop={10} style={styles.link}>
            <AppText tone="primary" bold>
              I already have an account
            </AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  shade: { backgroundColor: 'rgba(11, 18, 32, 0.35)' },
  bottom: { flex: 1, justifyContent: 'flex-end' },
  list: { flexGrow: 0, marginBottom: 12 },
  slide: { paddingHorizontal: 24 },
  title: { fontSize: 32, lineHeight: 38 },
  body: { marginTop: 12, opacity: 0.85, fontSize: 15 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginVertical: 18 },
  dot: { height: 7, borderRadius: 4, marginHorizontal: 4 },
  actions: { paddingHorizontal: 24, paddingBottom: 12 },
  link: { alignItems: 'center', paddingVertical: 18 },
});
