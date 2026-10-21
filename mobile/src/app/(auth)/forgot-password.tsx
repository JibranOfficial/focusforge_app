import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen, ScreenHeader } from '@/components/Screen';
import { api, errorMessage } from '@/lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      Alert.alert('Check your email', 'Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setStep('reset');
    } catch (err) {
      Alert.alert('Could not send code', errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (code.trim().length !== 6) {
      Alert.alert('Check your code', 'Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Choose a longer password', 'Use at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        password,
      });
      Alert.alert('Password updated', 'You can now log in with your new password.', [
        { text: 'Log in', onPress: () => router.replace('/login') },
      ]);
    } catch (err) {
      Alert.alert('Could not reset password', errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader />
      <View style={styles.body}>
        <AppText variant="h1">{step === 'email' ? 'Forgot password?' : 'Enter your code'}</AppText>
        <AppText tone="muted" style={styles.subtitle}>
          {step === 'email'
            ? "Enter your email and we'll send you a 6-digit reset code."
            : `We sent a code to ${email.trim().toLowerCase()}. It expires in 15 minutes.`}
        </AppText>

        {step === 'email' ? (
          <>
            <Input
              icon="mail-outline"
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Button title="Send code" onPress={sendCode} loading={loading} />
          </>
        ) : (
          <>
            <Input
              icon="keypad-outline"
              placeholder="6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
            />
            <Input
              icon="lock-closed-outline"
              placeholder="New password"
              secure
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            <Button title="Reset password" onPress={resetPassword} loading={loading} />
            <Button title="Use a different email" variant="ghost" onPress={() => setStep('email')} style={styles.ghost} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 16 },
  subtitle: { marginTop: 8, marginBottom: 28 },
  ghost: { marginTop: 8 },
});
