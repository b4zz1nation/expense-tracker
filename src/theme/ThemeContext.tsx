import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Appearance, useColorScheme, useWindowDimensions } from 'react-native';
import { getThemeModeSetting, setThemeModeSetting } from '../db/settingsRepo';
import { createAppTheme, isThemeMode, type AppTheme, type EffectiveTheme, type ThemeMode } from './theme';

type AppThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  setMode: (mode: ThemeMode) => Promise<void>;
  loading: boolean;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const stored = await getThemeModeSetting();
        if (!cancelled && isThemeMode(stored)) {
          setModeState(stored);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
  }, [mode]);

  const effectiveTheme: EffectiveTheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const isCompact = width < 380 || height < 700;
  const theme = useMemo(() => createAppTheme(effectiveTheme, isCompact), [effectiveTheme, isCompact]);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await setThemeModeSetting(nextMode);
  }, []);

  const value = useMemo<AppThemeContextValue>(() => ({
    theme,
    mode,
    effectiveTheme,
    setMode,
    loading,
  }), [effectiveTheme, loading, mode, setMode, theme]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }
  return context;
}
