import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, useColors } from '@/theme';
import { AppText } from './AppText';

type IconName = keyof typeof Ionicons.glyphMap;

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
  leading?: ReactNode;
}

interface Props<T extends string | number> {
  label?: string;
  placeholder?: string;
  icon?: IconName;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  title?: string;
  error?: string | null;
  emptyText?: string;
}

/** A form field that opens a bottom sheet of options. */
export function SelectField<T extends string | number>({
  label,
  placeholder = 'Select',
  icon,
  value,
  options,
  onChange,
  title,
  error,
  emptyText = 'Nothing to choose from yet.',
}: Props<T>) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="small" tone="muted" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.box, { backgroundColor: c.surfaceAlt, borderColor: error ? c.danger : c.border }]}
      >
        {icon ? <Ionicons name={icon} size={18} color={c.muted} style={styles.icon} /> : null}
        <AppText tone={selected ? 'text' : 'muted'} style={styles.flex} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={c.muted} />
      </Pressable>
      {error ? (
        <AppText variant="caption" tone="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: c.overlay }]} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.grabber, { backgroundColor: c.border }]} />
          <AppText variant="h3" style={styles.sheetTitle}>
            {title ?? label ?? 'Choose'}
          </AppText>
          <ScrollView style={styles.list}>
            {options.length === 0 ? (
              <AppText tone="muted" style={styles.empty}>
                {emptyText}
              </AppText>
            ) : null}
            {options.map((o) => {
              const active = o.value === value;
              return (
                <Pressable
                  key={String(o.value)}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={[styles.option, active ? { backgroundColor: c.primarySoft } : null]}
                >
                  {o.leading ? <View style={styles.leading}>{o.leading}</View> : null}
                  <AppText style={styles.flex}>{o.label}</AppText>
                  {active ? <Ionicons name="checkmark" size={20} color={c.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  error: { marginTop: 5, marginLeft: 2 },
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: 10 },
  sheetTitle: { marginBottom: 8, marginLeft: 4 },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: 12,
  },
  leading: { marginRight: 12 },
  empty: { padding: 16 },
});
