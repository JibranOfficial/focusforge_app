import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useColors } from '@/theme';
import { AppText } from './AppText';

export function ProgressBar({
  value,
  color,
  height = 8,
  style,
}: {
  /** 0 - 100 */
  value: number;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: c.surfaceAlt, overflow: 'hidden' }, style]}>
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: height,
          backgroundColor: color ?? c.accent,
        }}
      />
    </View>
  );
}

interface RingProps {
  size: number;
  strokeWidth: number;
  /** 0 - 1 */
  progress: number;
  children?: ReactNode;
  /** Use the purple -> teal gradient (timer) or a flat teal stroke (small rings). */
  gradient?: boolean;
  trackColor?: string;
}

export function ProgressRing({ size, strokeWidth, progress, children, gradient, trackColor }: RingProps) {
  const c = useColors();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c.primary} />
            <Stop offset="1" stopColor={c.accent} />
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor ?? c.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={gradient ? 'url(#ringGradient)' : c.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          // Start at 12 o'clock.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function PercentRing({ value, size = 76 }: { value: number; size?: number }) {
  return (
    <ProgressRing size={size} strokeWidth={7} progress={value / 100}>
      <AppText variant="h3">{`${Math.round(value)}%`}</AppText>
    </ProgressRing>
  );
}
