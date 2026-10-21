import { Image, View } from 'react-native';
import { useColors } from '@/theme';
import { AppText } from './AppText';

export function Avatar({ name, uri, size = 36 }: { name: string; uri?: string | null; size?: number }) {
  const c = useColors();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.primarySoft,
        borderWidth: 1,
        borderColor: c.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText variant={size > 50 ? 'h3' : 'small'} tone="primary" bold>
        {initials || '?'}
      </AppText>
    </View>
  );
}
