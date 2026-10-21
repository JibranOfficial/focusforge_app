import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, Screen, ScreenHeader, SectionHeader } from '@/components/Screen';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { User } from '@/types';

export default function Account() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const logout = useAuth((s) => s.logout);

  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const saveName = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Check your name', 'Enter at least 2 characters.');
      return;
    }
    setSavingName(true);
    try {
      const res = await api.patch<{ user: User }>('/auth/me', { name: name.trim() });
      setUser(res.user);
      Alert.alert('Saved', 'Your name has been updated.');
    } catch (err) {
      Alert.alert('Could not save', errorMessage(err));
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Choose a longer password', 'Use at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: user?.hasPassword ? currentPassword : undefined,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Password updated', 'Your password has been changed.');
    } catch (err) {
      Alert.alert('Could not change password', errorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and all your subjects, tasks and sessions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete('/auth/me', { password: user?.hasPassword ? deletePassword : undefined });
              await logout();
              router.replace('/login');
            } catch (err) {
              Alert.alert('Could not delete account', errorMessage(err));
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen keyboard>
      <ScreenHeader title="Account & Security" />

      <View style={styles.avatar}>
        <Avatar name={user?.name ?? '?'} uri={user?.avatarUrl} size={72} />
        <AppText variant="small" tone="muted" style={styles.email}>
          {user?.email}
        </AppText>
      </View>

      <Card>
        <Input label="Full name" value={name} onChangeText={setName} autoCapitalize="words" maxLength={80} />
        <Button title="Save name" onPress={saveName} loading={savingName} compact />
      </Card>

      <SectionHeader title={user?.hasPassword ? 'Change password' : 'Set a password'} />
      <Card>
        {user?.hasPassword ? (
          <Input
            label="Current password"
            secure
            autoCapitalize="none"
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
        ) : null}
        <Input
          label="New password"
          secure
          autoCapitalize="none"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 8 characters"
        />
        <Button title="Update password" onPress={changePassword} loading={savingPassword} compact />
      </Card>

      <SectionHeader title="Danger zone" />
      <Card>
        {user?.hasPassword ? (
          <Input
            label="Password (required to delete)"
            secure
            autoCapitalize="none"
            value={deletePassword}
            onChangeText={setDeletePassword}
          />
        ) : null}
        <Button title="Delete account" variant="danger" onPress={confirmDelete} loading={deleting} compact />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', marginVertical: 16 },
  email: { marginTop: 10 },
});
