import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Icon keys a subject can use. Rendered as the matching Ionicons "-outline" glyph. */
export const SUBJECT_ICONS = [
  'calculator',
  'rocket',
  'laptop',
  'book',
  'flask',
  'language',
  'code-slash',
  'color-palette',
  'musical-notes',
  'globe',
  'leaf',
  'school',
  'hardware-chip',
  'library',
  'barbell',
] as const;

export const SUBJECT_COLORS = [
  '#8B5CF6',
  '#5EEAD4',
  '#60A5FA',
  '#F59E0B',
  '#F472B6',
  '#34D399',
  '#F87171',
  '#A3E635',
] as const;

export function SubjectIcon({ icon, color, size = 44 }: { icon: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        name={`${icon}-outline` as keyof typeof Ionicons.glyphMap}
        size={size * 0.5}
        color="#0B1220"
      />
    </View>
  );
}
