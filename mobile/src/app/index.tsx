import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { Logo } from '@/components/Logo';
import { hasSeenOnboarding } from '@/lib/onboarding';
import { useAuth } from '@/store/auth';
import { useColors } from '@/theme';

/** Splash: brand mark + tagline, then routes to Home / Onboarding / Login. */
export default function Splash() {
  const router = useRouter();
  const c = useColors();
  const status = useAuth((s) => s.status);
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!minTimePassed || status === 'loading') return;
    let cancelled = false;
    (async () => {
      if (status === 'signedIn') {
        router.replace('/(tabs)/home');
        return;
      }
      const seen = await hasSeenOnboarding();
      if (!cancelled) router.replace(seen ? '/login' : '/onboarding');
    })();
    return () => {
      cancelled = true;
    };
  }, [minTimePassed, status, router]);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={styles.center}>
        <Logo size={92} />
        <AppText variant="display" style={styles.brand}>
          Focus<AppText variant="display" tone="primary">Forge</AppText>
        </AppText>
        <AppText tone="muted" center style={styles.tagline}>
          Plan smarter.{'\n'}Focus deeper.
        </AppText>
      </View>

      <Svg width="100%" height={170} viewBox="0 0 400 170" preserveAspectRatio="none" style={styles.waves}>
        <Defs>
          <LinearGradient id="w1" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#1E3A8A" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0.9" />
          </LinearGradient>
          <LinearGradient id="w2" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#0B1220" stopOpacity="0" />
            <Stop offset="1" stopColor="#5EEAD4" stopOpacity="0.45" />
          </LinearGradient>
        </Defs>
        <Path d="M0 120 C80 60 150 150 230 90 S350 40 400 70 L400 170 L0 170Z" fill="url(#w1)" opacity={0.7} />
        <Path d="M0 150 C90 100 170 170 250 120 S360 90 400 110 L400 170 L0 170Z" fill="url(#w2)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  brand: { marginTop: 16, fontSize: 38 },
  tagline: { marginTop: 14, fontSize: 17, lineHeight: 24 },
  waves: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
