import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { ThemeColors, getThemeColors } from './theme';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colors: ThemeColors;
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (pref: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemDark, setSystemDark] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemDark(colorScheme === 'dark');
    });
    return () => sub.remove();
  }, []);

  const isDark = preference === 'system' ? systemDark : preference === 'dark';
  const colors = getThemeColors(isDark);

  const setPreference = (pref: ThemePreference) => setPreferenceState(pref);
  const toggle = () => setPreferenceState(isDark ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ colors, preference, isDark, setPreference, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
