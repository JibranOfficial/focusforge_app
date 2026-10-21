import { Pressable, StyleSheet, View } from 'react-native';
import { radius, useColors } from '@/theme';
import { AppText } from './AppText';

interface Option<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const c = useColors();
  return (
    <View style={[styles.wrap, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.item, active ? { backgroundColor: c.primary } : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <AppText variant="small" bold tone={active ? 'white' : 'muted'}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 3,
  },
  item: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm + 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
