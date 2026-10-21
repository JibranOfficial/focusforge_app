import { useMemo } from 'react';
import * as SecureStore from '@/lib/storage';
import { create } from 'zustand';

export interface Colors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  text: string;
  muted: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  white: string;
  overlay: string;
}

// Palette taken from the Figma brand kit.
export const darkColors: Colors = {
  background: '#0B1220',
  surface: '#151C30',
  surfaceAlt: '#1B2440',
  border: '#262F4A',
  primary: '#8B5CF6',
  primarySoft: 'rgba(139, 92, 246, 0.16)',
  accent: '#5EEAD4',
  accentSoft: 'rgba(94, 234, 212, 0.14)',
  text: '#F1F5F9',
  muted: '#94A3B8',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.12)',
  warning: '#F59E0B',
  white: '#FFFFFF',
  overlay: 'rgba(5, 8, 16, 0.7)',
};

export const lightColors: Colors = {
  background: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1F8',
  border: '#E2E8F0',
  primary: '#7C4DFF',
  primarySoft: 'rgba(124, 77, 255, 0.12)',
  accent: '#0D9488',
  accentSoft: 'rgba(13, 148, 136, 0.12)',
  text: '#0F172A',
  muted: '#64748B',
  danger: '#DC2626',
  dangerSoft: 'rgba(220, 38, 38, 0.08)',
  warning: '#D97706',
  white: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
};

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

interface ThemeState {
  dark: boolean;
  setDark: (dark: boolean) => void;
  hydrate: () => Promise<void>;
}

const DARK_KEY = 'ff_dark_mode';

export const useThemeStore = create<ThemeState>((set) => ({
  dark: true,
  setDark: (dark) => {
    set({ dark });
    SecureStore.setItemAsync(DARK_KEY, dark ? '1' : '0').catch(() => {});
  },
  hydrate: async () => {
    try {
      const saved = await SecureStore.getItemAsync(DARK_KEY);
      if (saved !== null) set({ dark: saved === '1' });
    } catch {
      // ignore
    }
  },
}));

export function useColors(): Colors {
  const dark = useThemeStore((s) => s.dark);
  return dark ? darkColors : lightColors;
}

/** Build a StyleSheet from the current palette. Pass a module-level factory that calls StyleSheet.create. */
export function useThemedStyles<T>(factory: (c: Colors) => T): T {
  const colors = useColors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(colors), [colors]);
}
