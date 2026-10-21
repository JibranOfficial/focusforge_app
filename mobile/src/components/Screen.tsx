import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { radius, useColors } from '@/theme';
import { AppText } from './AppText';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  keyboard?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top'],
  keyboard,
  refreshing,
  onRefresh,
  contentStyle,
  footer,
}: ScreenProps) {
  const c = useColors();

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[padded ? styles.padded : null, styles.scrollContent, contentStyle]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={c.primary} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded ? styles.padded : null, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]} edges={edges}>
      {keyboard ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
          {footer}
        </KeyboardAvoidingView>
      ) : (
        <>
          {body}
          {footer}
        </>
      )}
    </SafeAreaView>
  );
}

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  hideBack?: boolean;
  right?: ReactNode;
  left?: ReactNode;
  center?: boolean;
}

export function ScreenHeader({ title, onBack, hideBack, right, left, center }: HeaderProps) {
  const c = useColors();
  const router = useRouter();

  const leading =
    left ??
    (hideBack ? (
      <View style={styles.headerSide} />
    ) : (
      <Pressable
        accessibilityLabel="Go back"
        hitSlop={10}
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home')))}
        style={styles.headerSide}
      >
        <Ionicons name="chevron-back" size={24} color={c.text} />
      </Pressable>
    ));

  return (
    <View style={styles.header}>
      {leading}
      {title ? (
        <AppText variant="h3" center={center ?? true} style={styles.headerTitle} numberOfLines={1}>
          {title}
        </AppText>
      ) : (
        <View style={styles.flex} />
      )}
      <View style={[styles.headerSide, styles.headerRight]}>{right}</View>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const c = useColors();
  const base: StyleProp<ViewStyle> = [
    styles.card,
    { backgroundColor: c.surface, borderColor: c.border },
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, pressed ? { opacity: 0.85 } : null]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="h3">{title}</AppText>
      {actionLabel ? (
        <Pressable hitSlop={10} onPress={onAction}>
          <AppText variant="small" tone="primary" bold>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 32, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 12 },
  headerSide: { width: 44, height: 44, justifyContent: 'center' },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { flex: 1 },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
});
