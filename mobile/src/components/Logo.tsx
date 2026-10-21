import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/** The FocusForge lightning-bolt mark (purple -> teal). */
export function Logo({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="bolt" x1="0.1" y1="0" x2="0.9" y2="1">
          <Stop offset="0" stopColor="#A78BFA" />
          <Stop offset="0.55" stopColor="#8B5CF6" />
          <Stop offset="1" stopColor="#5EEAD4" />
        </LinearGradient>
      </Defs>
      <Path d="M38 3 12 35h15l-5 26 30-35H36l2-23Z" fill="url(#bolt)" />
    </Svg>
  );
}
