import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/store/auth';
import { useColors, useThemeStore } from '@/theme';
import '@/lib/notifications';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const router = useRouter();
  const segments = useSegments();
  const status = useAuth((s) => s.status);
  const hydrateAuth = useAuth((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const dark = useThemeStore((s) => s.dark);
  const colors = useColors();

  useEffect(() => {
    void hydrateTheme();
    void hydrateAuth();
  }, [hydrateAuth, hydrateTheme]);

  // Route guard: signed-out users stay on public screens, signed-in users skip them.
  useEffect(() => {
    if (status === 'loading') return;
    const root = (segments as string[])[0];
    const isPublic = root === undefined || root === 'onboarding' || root === '(auth)';

    if (status === 'signedOut' && !isPublic) {
      router.replace('/login');
    } else if (status === 'signedIn' && (root === '(auth)' || root === 'onboarding')) {
      router.replace('/(tabs)/home');
    }
  }, [status, segments, router]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        {/* On the web the app is shown as a phone-sized column centred in the browser window. */}
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={
              Platform.OS === 'web'
                ? { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }
                : { flex: 1 }
            }
          >
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="task/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="subjects/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="session-complete" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            </Stack>
          </View>
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
