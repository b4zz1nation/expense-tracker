export type ThemeMode = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

export type AppColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  primarySoftBorder: string;
  onPrimary: string;
  income: string;
  incomeSoft: string;
  onIncomeSoft: string;
  expense: string;
  expenseSoft: string;
  onExpenseSoft: string;
  warning: string;
  warningSoft: string;
  onWarningSoft: string;
  border: string;
  divider: string;
  shadow: string;
  overlay: string;
  input: string;
  tabBar: string;
  sheet: string;
  sheetHandle: string;
  disabled: string;
  chartTrack: string;
};

export type AppSpacing = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  screen: number;
  card: number;
};

export type AppTheme = {
  mode: EffectiveTheme;
  isDark: boolean;
  isCompact: boolean;
  colors: AppColors;
  spacing: AppSpacing;
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
};

const lightColors: AppColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  surfaceMuted: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  primarySoft: '#DBEAFE',
  primarySoftBorder: '#BFDBFE',
  onPrimary: '#FFFFFF',
  income: '#15803D',
  incomeSoft: '#DCFCE7',
  onIncomeSoft: '#166534',
  expense: '#DC2626',
  expenseSoft: '#FEE2E2',
  onExpenseSoft: '#991B1B',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  onWarningSoft: '#92400E',
  border: '#E2E8F0',
  divider: '#CBD5E1',
  shadow: '#0F172A',
  overlay: 'rgba(15, 23, 42, 0.48)',
  input: '#FFFFFF',
  tabBar: '#FFFFFF',
  sheet: '#F8FAFC',
  sheetHandle: '#CBD5E1',
  disabled: '#94A3B8',
  chartTrack: '#E2E8F0',
};

const darkColors: AppColors = {
  background: '#0B1020',
  surface: '#111827',
  surfaceAlt: '#1E293B',
  surfaceMuted: '#334155',
  text: '#E2E8F0',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textInverse: '#0B1020',
  primary: '#60A5FA',
  primaryPressed: '#93C5FD',
  primarySoft: '#1E3A8A',
  primarySoftBorder: '#2563EB',
  onPrimary: '#0B1020',
  income: '#4ADE80',
  incomeSoft: '#052E16',
  onIncomeSoft: '#4ADE80',
  expense: '#F87171',
  expenseSoft: '#450A0A',
  onExpenseSoft: '#F87171',
  warning: '#FBBF24',
  warningSoft: '#451A03',
  onWarningSoft: '#FBBF24',
  border: '#334155',
  divider: '#475569',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.62)',
  input: '#0F172A',
  tabBar: '#111827',
  sheet: '#0B1020',
  sheetHandle: '#475569',
  disabled: '#64748B',
  chartTrack: '#334155',
};

const regularSpacing: AppSpacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, screen: 20, card: 18 };
const compactSpacing: AppSpacing = { xs: 4, sm: 6, md: 10, lg: 14, xl: 18, screen: 16, card: 14 };

export function createAppTheme(mode: EffectiveTheme, isCompact: boolean): AppTheme {
  return {
    mode,
    isDark: mode === 'dark',
    isCompact,
    colors: mode === 'dark' ? darkColors : lightColors,
    spacing: isCompact ? compactSpacing : regularSpacing,
    radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
  };
}

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}
