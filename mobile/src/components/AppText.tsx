import { Text, type TextProps, type TextStyle } from 'react-native';
import { font, useColors } from '@/theme';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'small' | 'caption';
type Tone = 'text' | 'muted' | 'primary' | 'accent' | 'danger' | 'white';

const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: font.bold, fontSize: 40, lineHeight: 46 },
  h1: { fontFamily: font.bold, fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: font.bold, fontSize: 22, lineHeight: 28 },
  h3: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: font.medium, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: font.regular, fontSize: 12, lineHeight: 16 },
};

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
  bold?: boolean;
  center?: boolean;
}

export function AppText({ variant = 'body', tone = 'text', bold, center, style, ...rest }: Props) {
  const colors = useColors();
  return (
    <Text
      {...rest}
      style={[
        variants[variant],
        { color: colors[tone] },
        bold ? { fontFamily: font.semibold } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    />
  );
}
