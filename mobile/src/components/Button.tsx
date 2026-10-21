import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { font, radius, useColors } from '@/theme';
import { AppText } from './AppText';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style, compact }: Props) {
  const c = useColors();
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: c.primary, border: c.primary, fg: c.white },
    outline: { bg: c.surface, border: c.border, fg: c.text },
    ghost: { bg: 'transparent', border: 'transparent', fg: c.primary },
    danger: { bg: c.dangerSoft, border: c.dangerSoft, fg: c.danger },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : null,
        { backgroundColor: palette.bg, borderColor: palette.border },
        variant === 'primary' && !inactive ? styles.glow : null,
        { opacity: inactive ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <AppText style={{ color: palette.fg, fontFamily: font.semibold, fontSize: 15 }}>{title}</AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  compact: { minHeight: 44 },
  glow: {
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 8 },
});
