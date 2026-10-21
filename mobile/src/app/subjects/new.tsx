import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen, ScreenHeader } from '@/components/Screen';
import { SUBJECT_COLORS, SUBJECT_ICONS, SubjectIcon } from '@/components/SubjectIcon';
import { useCreateSubject } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { radius, useColors } from '@/theme';

export default function NewSubject() {
  const router = useRouter();
  const c = useColors();
  const create = useCreateSubject();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(SUBJECT_ICONS[0]);
  const [color, setColor] = useState<string>(SUBJECT_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) {
      setError('Enter a subject name');
      return;
    }
    setError(null);
    try {
      await create.mutateAsync({ name: name.trim(), icon, color });
      router.back();
    } catch (err) {
      Alert.alert('Could not add subject', errorMessage(err));
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader title="Add Subject" />
      <View style={styles.preview}>
        <SubjectIcon icon={icon} color={color} size={72} />
      </View>

      <Input label="Subject name" placeholder="e.g. Chemistry" value={name} onChangeText={setName} error={error} maxLength={60} />

      <AppText variant="small" tone="muted" style={styles.label}>
        Icon
      </AppText>
      <View style={styles.grid}>
        {SUBJECT_ICONS.map((key) => {
          const active = key === icon;
          return (
            <Pressable
              key={key}
              onPress={() => setIcon(key)}
              style={[
                styles.iconCell,
                { backgroundColor: active ? c.primarySoft : c.surface, borderColor: active ? c.primary : c.border },
              ]}
              accessibilityLabel={`Icon ${key}`}
            >
              <Ionicons name={`${key}-outline` as keyof typeof Ionicons.glyphMap} size={22} color={active ? c.primary : c.text} />
            </Pressable>
          );
        })}
      </View>

      <AppText variant="small" tone="muted" style={styles.label}>
        Color
      </AppText>
      <View style={styles.grid}>
        {SUBJECT_COLORS.map((col) => (
          <Pressable
            key={col}
            onPress={() => setColor(col)}
            style={[styles.swatch, { backgroundColor: col, borderColor: col === color ? c.text : 'transparent' }]}
            accessibilityLabel={`Color ${col}`}
          >
            {col === color ? <Ionicons name="checkmark" size={18} color="#0B1220" /> : null}
          </Pressable>
        ))}
      </View>

      <Button title="Save" onPress={save} loading={create.isPending} style={styles.save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center', marginVertical: 18 },
  label: { marginBottom: 8, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  iconCell: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginBottom: 10,
  },
  save: { marginTop: 16 },
});
