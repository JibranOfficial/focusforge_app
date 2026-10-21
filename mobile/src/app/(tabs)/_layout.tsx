import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettings, useTasksRange } from '@/hooks/queries';
import { addDays, startOfDay } from '@/lib/dates';
import { syncReminders } from '@/lib/notifications';
import { useTimer } from '@/store/timer';
import { font, useColors, useThemeStore } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(active: IconName, inactive: IconName) {
  // eslint-disable-next-line react/display-name
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={22} color={color} />
  );
}

export default function TabsLayout() {
  const c = useColors();
  const setDark = useThemeStore((s) => s.setDark);
  const settings = useSettings();

  // Next 8 days of tasks feed the local reminder scheduler.
  const today = startOfDay(new Date());
  const upcoming = useTasksRange(today, addDays(today, 8));

  // Apply server-side preferences once they load / change.
  useEffect(() => {
    const s = settings.data;
    if (!s) return;
    setDark(s.darkMode);
    useTimer.getState().syncDurations(s.focusMinutes, s.breakMinutes, s.longBreakMinutes);
  }, [settings.data, setDark]);

  useEffect(() => {
    if (settings.data && upcoming.data) {
      void syncReminders(upcoming.data, settings.data);
    }
  }, [settings.data, upcoming.data]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: c.background },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan', tabBarIcon: tabIcon('calendar', 'calendar-outline') }} />
      <Tabs.Screen name="timer" options={{ title: 'Timer', tabBarIcon: tabIcon('timer', 'timer-outline') }} />
      <Tabs.Screen name="subjects" options={{ title: 'Subjects', tabBarIcon: tabIcon('layers', 'layers-outline') }} />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: tabIcon('stats-chart', 'stats-chart-outline') }}
      />
      {/* Settings lives inside the tab navigator (so the bar stays visible) but has no tab button. */}
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
