import { getDatabase } from './database';
import { migrateDb } from './migrations';
import { getDeviceDefaultCurrencyCode } from '../lib/currencies';
import { isThemeMode, type ThemeMode } from '../theme/theme';

let initPromise: Promise<void> | null = null;

const SETTINGS_KEYS = {
  preferredCurrency: 'preferred_currency',
  themeMode: 'theme_mode',
  userName: 'user_name',
  monthlyBudgetCents: 'monthly_budget_cents',
  onboardingComplete: 'onboarding_complete',
} as const;

async function initDb(): Promise<void> {
  initPromise ??= (async () => {
    const db = await getDatabase();
    await migrateDb(db);
  })();
  await initPromise;
}

export async function getSetting(key: string): Promise<string | null> {
  await initDb();
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await initDb();
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, new Date().toISOString()],
  );
}

export async function clearSetting(key: string): Promise<void> {
  await initDb();
  const db = await getDatabase();
  await db.runAsync('DELETE FROM app_settings WHERE key = ?', [key]);
}

export async function getPreferredCurrencySetting(): Promise<string | null> {
  return getSetting(SETTINGS_KEYS.preferredCurrency);
}

export async function getPreferredCurrencyCode(): Promise<string> {
  const stored = await getPreferredCurrencySetting();
  return stored?.trim().toUpperCase() || getDeviceDefaultCurrencyCode();
}

export async function setPreferredCurrencyCode(code: string): Promise<void> {
  await setSetting(SETTINGS_KEYS.preferredCurrency, code.trim().toUpperCase());
}

export async function resetPreferredCurrencyCode(): Promise<void> {
  await clearSetting(SETTINGS_KEYS.preferredCurrency);
}

export async function getThemeModeSetting(): Promise<ThemeMode | null> {
  const stored = await getSetting(SETTINGS_KEYS.themeMode);
  return isThemeMode(stored) ? stored : null;
}

export async function setThemeModeSetting(mode: ThemeMode): Promise<void> {
  await setSetting(SETTINGS_KEYS.themeMode, mode);
}


export type UserProfile = {
  name: string;
  monthlyBudgetCents: number;
  onboardingComplete: boolean;
};

export async function getUserProfile(): Promise<UserProfile | null> {
  const [name, monthlyBudget, onboardingComplete] = await Promise.all([
    getSetting(SETTINGS_KEYS.userName),
    getSetting(SETTINGS_KEYS.monthlyBudgetCents),
    getSetting(SETTINGS_KEYS.onboardingComplete),
  ]);
  const budgetCents = Number(monthlyBudget ?? 0);
  if (onboardingComplete !== 'true' || !name?.trim() || !Number.isSafeInteger(budgetCents) || budgetCents <= 0) {
    return null;
  }
  return {
    name: name.trim(),
    monthlyBudgetCents: budgetCents,
    onboardingComplete: true,
  };
}

export async function saveUserProfile(name: string, monthlyBudgetCents: number): Promise<UserProfile> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Enter your name.');
  if (!Number.isSafeInteger(monthlyBudgetCents) || monthlyBudgetCents <= 0) throw new Error('Enter a valid monthly budget.');

  await Promise.all([
    setSetting(SETTINGS_KEYS.userName, trimmedName),
    setSetting(SETTINGS_KEYS.monthlyBudgetCents, String(monthlyBudgetCents)),
    setSetting(SETTINGS_KEYS.onboardingComplete, 'true'),
  ]);

  return {
    name: trimmedName,
    monthlyBudgetCents,
    onboardingComplete: true,
  };
}
