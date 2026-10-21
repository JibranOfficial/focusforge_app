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

export default function SignUp() {
  const router = useRouter();
  const c = useColors();
  const register = useAuth((s) => s.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Enter your full name';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (password.length < 8) next.password = 'Use at least 8 characters';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      router.replace('/(tabs)/home');
    } catch (err) {
      Alert.alert('Could not create account', errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader onBack={() => router.replace('/onboarding')} />
      <View style={styles.body}>
        <AppText variant="h1">Create your account</AppText>
        <AppText tone="muted" style={styles.subtitle}>
          Join FocusForge and take control of your study journey.
        </AppText>

        <Input
          icon="person-outline"
          placeholder="Full name"
          autoCapitalize="words"
          autoComplete="name"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />
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
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        <Button title="Sign Up" onPress={submit} loading={loading} style={styles.submit} />

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
            Already have an account?{' '}
          </AppText>
          <Pressable onPress={() => router.replace('/login')} hitSlop={10}>
            <AppText variant="small" tone="primary" bold>
              Log in
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
  submit: { marginTop: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  or: { marginHorizontal: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
});
