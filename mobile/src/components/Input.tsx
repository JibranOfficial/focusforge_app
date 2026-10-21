import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { font, radius, useColors } from '@/theme';
import { AppText } from './AppText';

type IconName = keyof typeof Ionicons.glyphMap;

interface Props extends Omit<TextInputProps, 'style'> {
  icon?: IconName;
  secure?: boolean;
  error?: string | null;
  label?: string;
}

export function Input({ icon, secure, error, label, ...rest }: Props) {
  const c = useColors();
  const [hidden, setHidden] = useState(Boolean(secure));
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="small" tone="muted" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.box,
          {
            backgroundColor: c.surfaceAlt,
            borderColor: error ? c.danger : focused ? c.primary : c.border,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={19} color={c.muted} style={styles.icon} /> : null}
        <TextInput
          {...rest}
          secureTextEntry={secure ? hidden : rest.secureTextEntry}
          placeholderTextColor={c.muted}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, { color: c.text }]}
        />
        {secure ? (
          <Pressable hitSlop={10} onPress={() => setHidden((h) => !h)} accessibilityLabel="Toggle password visibility">
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={c.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" tone="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { marginBottom: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontFamily: font.regular, fontSize: 15, height: '100%' },
  error: { marginTop: 5, marginLeft: 2 },
});
