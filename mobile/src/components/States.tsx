import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

export function LoadingState() {
  const c = useColors();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={c.primary} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useColors();
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={36} color={c.muted} />
      <AppText tone="muted" center style={styles.text}>
        {message}
      </AppText>
      {onRetry ? <Button title="Try again" variant="outline" compact onPress={onRetry} style={styles.btn} /> : null}
    </View>
  );
}

export function EmptyState({ icon = 'sparkles-outline', title, hint }: { icon?: keyof typeof Ionicons.glyphMap; title: string; hint?: string }) {
  const c = useColors();
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={34} color={c.muted} />
      <AppText bold center style={styles.text}>
        {title}
      </AppText>
      {hint ? (
        <AppText variant="small" tone="muted" center>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  text: { marginTop: 10, marginBottom: 6 },
  btn: { marginTop: 8, minWidth: 140 },
});
