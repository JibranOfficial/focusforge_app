import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Hero illustration for the onboarding screen: a hiker on a mountain under a purple night sky. */
export function NightScene({ width, height }: { width: number; height: number }) {
  const stars: [number, number, number][] = [
    [0.12, 0.1, 1.4],
    [0.28, 0.2, 1],
    [0.4, 0.07, 1.2],
    [0.62, 0.16, 1],
    [0.78, 0.06, 1.5],
    [0.9, 0.22, 1],
    [0.08, 0.32, 1],
    [0.5, 0.3, 0.9],
    [0.93, 0.4, 1.2],
  ];

  return (
    <Svg width={width} height={height} viewBox="0 0 400 480" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0B1220" />
          <Stop offset="0.55" stopColor="#1F1B4D" />
          <Stop offset="1" stopColor="#3B2A7A" />
        </LinearGradient>
        <LinearGradient id="far" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2E2A6B" />
          <Stop offset="1" stopColor="#1A1840" />
        </LinearGradient>
        <LinearGradient id="near" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#141432" />
          <Stop offset="1" stopColor="#0B1220" />
        </LinearGradient>
        <LinearGradient id="moon" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#C4B5FD" />
          <Stop offset="1" stopColor="#8B5CF6" />
        </LinearGradient>
      </Defs>

      <Rect width="400" height="480" fill="url(#sky)" />
      {stars.map(([x, y, r], i) => (
        <Circle key={i} cx={x * 400} cy={y * 480} r={r} fill="#E9E5FF" opacity={0.8} />
      ))}
      <Circle cx="300" cy="120" r="30" fill="url(#moon)" />
      <Circle cx="300" cy="120" r="44" fill="#8B5CF6" opacity={0.14} />

      <Path d="M0 360 L70 270 L120 320 L190 220 L260 330 L320 270 L400 350 L400 480 L0 480Z" fill="url(#far)" />
      <Path d="M0 420 L90 330 L150 390 L215 300 L290 400 L350 350 L400 410 L400 480 L0 480Z" fill="url(#near)" />

      {/* hiker silhouette on the ridge */}
      <Path
        d="M213 300 c-3-1-5-5-4-9 l2-9 c1-3 4-5 7-4 3 1 4 4 4 7 l-1 8 c3 2 4 6 3 10 l-1 8 -2 0 0 -8 -4 -1 -1 9 -3 0 0-11Z"
        fill="#0B1220"
      />
      <Circle cx="215" cy="274" r="5" fill="#0B1220" />
    </Svg>
  );
}
