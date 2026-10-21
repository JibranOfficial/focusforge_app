import type * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Settings, Task } from '@/types';

const PREFIX = 'reminder:';
const isWeb = Platform.OS === 'web';

// Expo Go has no notifications module, so load it only in real builds
let Notifications: typeof ExpoNotifications | null = null;
try {
  if (!isWeb && Constants.appOwnership !== 'expo') {
    Notifications = require('expo-notifications');
  }
} catch {
  Notifications = null;
}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () =>
      ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }) as ExpoNotifications.NotificationBehavior,
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const N = Notifications;
  if (!N) return false;
  try {
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('default', {
        name: 'FocusForge',
        importance: N.AndroidImportance.DEFAULT,
        lightColor: '#8B5CF6',
      });
    }
    const current = await N.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await N.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

async function cancelAllReminders(): Promise<void> {
  const N = Notifications;
  if (!N) return;
  const scheduled = await N.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(PREFIX))
      .map((n) => N.cancelScheduledNotificationAsync(n.identifier)),
  );
}

export async function syncReminders(
  tasks: Task[],
  settings: Settings,
): Promise<void> {
  const N = Notifications;
  if (!N) return;
  try {
    await cancelAllReminders();

    const s = settings as any;
    if (s?.remindersEnabled === false) return;
    if (!(await ensureNotificationPermission())) return;

    const minutesBefore: number = Number(s?.reminderMinutesBefore ?? 10);
    const now = Date.now();

    for (const task of tasks) {
      const t = task as any;
      if (t.completed || t.done) continue;

      const dueRaw = t.dueAt ?? t.dueDate ?? t.due;
      if (!dueRaw) continue;

      const fireAt = new Date(dueRaw).getTime() - minutesBefore * 60_000;
      if (Number.isNaN(fireAt) || fireAt <= now) continue;

      await N.scheduleNotificationAsync({
        identifier: `${PREFIX}${t.id}`,
        content: {
          title: 'FocusForge',
          body: `${t.title ?? 'Task'} is due soon`,
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: new Date(fireAt),
          channelId: 'default',
        },
      });
    }
  } catch (e) {
    console.warn('syncReminders failed', e);
  }
}