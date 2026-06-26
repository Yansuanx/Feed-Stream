import { useColorScheme } from 'react-native';

export const Colors = {
  gold: '#C9A227',
  goldLight: '#E0BE4A',
  goldDark: '#A8861C',
  black: '#000000',
  white: '#FFFFFF',
  background: '#FAFAFA',
  backgroundDark: '#0A0A0A',
  surface: '#FFFFFF',
  surfaceDark: '#1A1A1A',
  surfaceElevated: '#F5F5F5',
  surfaceElevatedDark: '#242424',
  textPrimary: '#000000',
  textPrimaryDark: '#FFFFFF',
  textSecondary: '#666666',
  textSecondaryDark: '#A0A0A0',
  textTertiary: '#999999',
  textTertiaryDark: '#777777',
  border: '#E5E5E5',
  borderDark: '#2A2A2A',
  success: '#2E7D32',
  warning: '#ED6C02',
  error: '#D32F2F',
  overlay: 'rgba(0, 0, 0, 0.6)',
  blurTint: 'light',
  blurTintDark: 'dark',
};

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  gold: string;
  goldLight: string;
  goldDark: string;
  black: string;
  white: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  overlay: string;
  error: string;
  success: string;
  warning: string;
  blurTint: 'light' | 'dark';
  isDark: boolean;
}

export function getThemeColors(isDark: boolean): ThemeColors {
  return {
    gold: Colors.gold,
    goldLight: Colors.goldLight,
    goldDark: Colors.goldDark,
    black: Colors.black,
    white: Colors.white,
    background: isDark ? Colors.backgroundDark : Colors.background,
    surface: isDark ? Colors.surfaceDark : Colors.surface,
    surfaceElevated: isDark ? Colors.surfaceElevatedDark : Colors.surfaceElevated,
    textPrimary: isDark ? Colors.textPrimaryDark : Colors.textPrimary,
    textSecondary: isDark ? Colors.textSecondaryDark : Colors.textSecondary,
    textTertiary: isDark ? Colors.textTertiaryDark : Colors.textTertiary,
    border: isDark ? Colors.borderDark : Colors.border,
    overlay: Colors.overlay,
    error: Colors.error,
    success: Colors.success,
    warning: Colors.warning,
    blurTint: isDark ? 'dark' : 'light',
    isDark,
  };
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const Typography = {
  heading: 'PlayfairDisplay',
  body: 'Inter',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
};

export function useThemeColors(): ThemeColors {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';
  return getThemeColors(isDark);
}
