import { createElement, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { font, radius, useColors, useThemeStore } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface Props {
  label?: string;
  mode: 'date' | 'time';
  value: Date;
  onChange: (value: Date) => void;
  text: string;
  minimumDate?: Date;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function DateTimeField({ label, mode, value, onChange, text, minimumDate }: Props) {
  const c = useColors();
  const dark = useThemeStore((s) => s.dark);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleAndroid = (event: DateTimePickerEvent, selected?: Date) => {
    setOpen(false);
    if (event.type === 'set' && selected) onChange(selected);
  };

  const icon = mode === 'date' ? 'calendar-outline' : 'time-outline';

  // Browsers: use the native <input type="date|time"> picker.
  if (Platform.OS === 'web') {
    const inputValue =
      mode === 'date'
        ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
        : `${pad(value.getHours())}:${pad(value.getMinutes())}`;

    const onWebChange = (e: { target: { value: string } }) => {
      const raw = e.target.value;
      if (!raw) return;
      const next = new Date(value);
      if (mode === 'date') {
        const [y, m, d] = raw.split('-').map(Number);
        next.setFullYear(y, m - 1, d);
      } else {
        const [h, min] = raw.split(':').map(Number);
        next.setHours(h, min, 0, 0);
      }
      onChange(next);
    };

    return (
      <View style={styles.wrap}>
        {label ? (
          <AppText variant="small" tone="muted" style={styles.label}>
            {label}
          </AppText>
        ) : null}
        <View style={[styles.box, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
          <Ionicons name={icon} size={18} color={c.muted} style={styles.icon} />
          {createElement('input', {
            type: mode,
            value: inputValue,
            min: minimumDate && mode === 'date'
              ? `${minimumDate.getFullYear()}-${pad(minimumDate.getMonth() + 1)}-${pad(minimumDate.getDate())}`
              : undefined,
            onChange: onWebChange,
            style: {
              flex: 1,
              height: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: c.text,
              fontFamily: font.regular,
              fontSize: 15,
              colorScheme: dark ? 'dark' : 'light',
            },
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="small" tone="muted" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <Pressable
        onPress={() => {
          setDraft(value);
          setOpen(true);
        }}
        style={[styles.box, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}
      >
        <Ionicons name={icon} size={18} color={c.muted} style={styles.icon} />
        <AppText style={styles.flex}>{text}</AppText>
        <Ionicons name="chevron-down" size={18} color={c.muted} />
      </Pressable>

      {Platform.OS === 'android' ? (
        open ? (
          <DateTimePicker value={value} mode={mode} onChange={handleAndroid} minimumDate={minimumDate} />
        ) : null
      ) : (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={[styles.flex, { backgroundColor: c.overlay }]} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
            <DateTimePicker
              value={draft}
              mode={mode}
              display="spinner"
              themeVariant={dark ? 'dark' : 'light'}
              minimumDate={minimumDate}
              onChange={(_e, selected) => {
                if (selected) setDraft(selected);
              }}
            />
            <Button
              title="Done"
              onPress={() => {
                onChange(draft);
                setOpen(false);
              }}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { marginBottom: 14, flex: 1 },
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
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 32,
  },
});
