import { useEffect, useState } from 'react';
import { Alert } from '@/lib/alert';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { useAuth } from '@/store/auth';
import { errorMessage } from '@/lib/api';

WebBrowser.maybeCompleteAuthSession();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const configured = Boolean(webClientId || iosClientId || androidClientId);

export function GoogleButton() {
  const loginWithGoogle = useAuth((s) => s.loginWithGoogle);
  const [busy, setBusy] = useState(false);

  // The hook throws if a client id is missing, so fall back to placeholders when Google isn't configured.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: webClientId ?? 'not-configured',
    iosClientId: iosClientId ?? 'not-configured',
    androidClientId: androidClientId ?? 'not-configured',
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params?.id_token;
    if (!idToken) {
      Alert.alert('Google sign-in failed', 'No ID token was returned.');
      return;
    }
    setBusy(true);
    loginWithGoogle(idToken)
      .catch((err) => Alert.alert('Google sign-in failed', errorMessage(err)))
      .finally(() => setBusy(false));
  }, [response, loginWithGoogle]);

  const onPress = () => {
    if (!configured) {
      Alert.alert(
        'Google sign-in not set up',
        'Add your Google OAuth client IDs to the .env file (see .env.example), then restart the app.',
      );
      return;
    }
    void promptAsync();
  };

  return (
    <Button
      title="Continue with Google"
      variant="outline"
      loading={busy}
      disabled={!request && configured}
      onPress={onPress}
      icon={<Ionicons name="logo-google" size={18} color="#EA4335" />}
    />
  );
}
