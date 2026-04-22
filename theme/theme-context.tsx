import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import {
  ColorScheme,
  DarkPalette,
  LightPalette,
  Palette,
} from '@/constants/theme';

// Three options the user can pick from — two fixed, one that follows the phone.
export type ThemeMode = 'light' | 'dark' | 'system';

// Everything every screen needs from the theme: the mode the user picked,
// what's actually showing, the palette to paint with, and a setter to change modes.
type ThemeContextValue = {
  mode: ThemeMode;
  resolvedScheme: ColorScheme;
  colors: Palette;
  setMode: (next: ThemeMode) => Promise<void>;
};

// Storage key we save the choice under so it survives a restart.
const STORAGE_KEY = 'is447.themeMode';

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Wraps the whole app. Place this at the root layout and everything inside
// can read the current palette via the hook below.
export default function ThemeProvider({ children }: { children: ReactNode }) {
  // Whatever the phone's own light/dark setting is — used for "system" mode.
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  // Don't render anything until we've read from storage, otherwise you get
  // a flash of the wrong theme on a cold boot.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // On first load, read any saved preference out of AsyncStorage.
    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw === 'light' || raw === 'dark' || raw === 'system') {
          setModeState(raw);
        }
      } finally {
        setLoaded(true);
      }
    };
    void hydrate();
  }, []);

  // When the user picks a mode, update state and save it for next time.
  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  // Work out what we're actually showing right now. If they picked "system"
  // we defer to the phone; otherwise it's whatever they chose.
  const resolvedScheme: ColorScheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  // Pick the matching palette.
  const colors = resolvedScheme === 'dark' ? DarkPalette : LightPalette;

  // Memoise so screens only re-render when something actually changes.
  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedScheme, colors, setMode }),
    [mode, resolvedScheme, colors, setMode]
  );

  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// The hook every screen uses. If somehow it's called outside the provider
// (e.g. in a test that doesn't wrap), we hand back sensible light defaults
// so things don't fall over.
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      mode: 'system',
      resolvedScheme: 'light',
      colors: LightPalette,
      setMode: async () => {},
    };
  }
  return ctx;
}

// Small helper that takes a "styles as a function of colours" factory and
// returns a memoised StyleSheet. Saves repeating the same useMemo pattern
// in every component.
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: Palette) => T
): T {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create(factory(colors)), [factory, colors]);
}
