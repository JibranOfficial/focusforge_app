import type { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { useUpdateSettings } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { radius, useColors, useThemeStore } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function Row({
  icon,
  title,
  onPress,
  right,
  last,
}: {
  icon: IconName;
  title: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        !last ? { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth } : null,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Ionicons name={icon} size={21} color={c.text} style={styles.rowIcon} />
      <AppText style={styles.rowTitle}>{title}</AppText>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={c.muted} /> : null)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const c = useColors();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const dark = useThemeStore((s) => s.dark);
  const setDark = useThemeStore((s) => s.setDark);
  const updateSettings = useUpdateSettings();

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const sync = async () => {
    await qc.invalidateQueries();
    Alert.alert('Data & Sync', 'Your data is up to date.');
  };

  return (
    <Screen>
      <AppText variant="h2" style={styles.title}>
        Settings
      </AppText>

      <Card onPress={() => router.push('/account')} style={styles.profile}>
        <View style={styles.profileRow}>
          <Avatar name={user?.name ?? '?'} uri={user?.avatarUrl} size={56} />
          <View style={styles.profileText}>
            <AppText variant="h3">{user?.name ?? 'Your account'}</AppText>
            <AppText variant="small" tone="muted">
              {user?.email}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        </View>
      </Card>

      <Card style={styles.group}>
        <Row icon="shield-checkmark-outline" title="Account & Security" onPress={() => router.push('/account')} />
        <Row icon="notifications-outline" title="Notifications" onPress={() => router.push('/reminders')} />
        <Row icon="alarm-outline" title="Study Reminders" onPress={() => router.push('/reminders')} />
        <Row
          icon="contrast-outline"
          title="Appearance"
          right={
            <View style={styles.switchWrap}>
              <AppText variant="small" tone="muted" style={styles.switchLabel}>
                Dark Mode
              </AppText>
              <Switch
                value={dark}
                onValueChange={(v) => {
                  setDark(v);
                  updateSettings.mutate({ darkMode: v });
                }}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor={c.white}
              />
            </View>
          }
        />
        <Row icon="sync-outline" title="Data & Sync" onPress={sync} />
        <Row
          icon="help-circle-outline"
          title="Help & Support"
          onPress={() => Linking.openURL('mailto:support@focusforge.app?subject=FocusForge%20support')}
        />
        <Row
          icon="information-circle-outline"
          title="About FocusForge"
          last
          onPress={() => Alert.alert('FocusForge', 'Version 1.0.0\nPlan smarter. Focus deeper.')}
        />
      </Card>

      <Button
        title="Log Out"
        variant="outline"
        onPress={confirmLogout}
        icon={<Ionicons name="log-out-outline" size={19} color={c.primary} />}
        style={styles.logout}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 14, marginBottom: 16 },
  profile: { marginBottom: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileText: { flex: 1, marginHorizontal: 14 },
  group: { paddingVertical: 4, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  rowIcon: { width: 28 },
  rowTitle: { flex: 1, marginLeft: 6 },
  switchWrap: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { marginRight: 8 },
  logout: { marginTop: 18, borderRadius: radius.md },
});
