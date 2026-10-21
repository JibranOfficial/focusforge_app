import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { GoogleButton } from '@/components/GoogleButton';
import { Input } from '@/components/Input';
import { Screen, ScreenHeader } from '@/components/Screen';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { useColors } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const router = useRouter();
  const c = useColors();
  const login = useAuth((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/home');
    } catch (err) {
      Alert.alert('Could not log in', errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader onBack={() => router.replace('/onboarding')} />
      <View style={styles.body}>
        <AppText variant="h1">Welcome back</AppText>
        <AppText tone="muted" style={styles.subtitle}>
          Log in to continue to FocusForge.
        </AppText>

        <Input
          icon="mail-outline"
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
        />
        <Input
          icon="lock-closed-outline"
          placeholder="Password"
          secure
          autoCapitalize="none"
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        <Pressable onPress={() => router.push('/forgot-password')} hitSlop={10} style={styles.forgot}>
          <AppText variant="small" tone="primary" bold>
            Forgot password?
          </AppText>
        </Pressable>

        <Button title="Log In" onPress={submit} loading={loading} />

        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: c.border }]} />
          <AppText variant="small" tone="muted" style={styles.or}>
            or
          </AppText>
          <View style={[styles.line, { backgroundColor: c.border }]} />
        </View>

        <GoogleButton />

        <View style={styles.footer}>
          <AppText variant="small" tone="muted">
            Don't have an account?{' '}
          </AppText>
          <Pressable onPress={() => router.replace('/signup')} hitSlop={10}>
            <AppText variant="small" tone="primary" bold>
              Sign up
            </AppText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 16 },
  subtitle: { marginTop: 8, marginBottom: 28 },
  forgot: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -2 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  or: { marginHorizontal: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
});
