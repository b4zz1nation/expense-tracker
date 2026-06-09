import { getDatabase } from './database';
import { migrateDb } from './migrations';
import { DEFAULT_BUDGET_CATEGORIES, normalizeBudgetCategories, parseBudgetCategoriesJson, totalCategoryBudgetCents } from '../lib/categoryBudgets';
import { getDeviceDefaultCurrencyCode } from '../lib/currencies';
import { isThemeMode, type ThemeMode } from '../theme/theme';
import type { BudgetCategory } from '../types/categoryBudget';

let initPromise: Promise<void> | null = null;

const SETTINGS_KEYS = {
  preferredCurrency: 'preferred_currency',
  themeMode: 'theme_mode',
  userName: 'user_name',
  userPhotoUri: 'user_photo_uri',
  monthlyBudgetCents: 'monthly_budget_cents',
  categoryBudgets: 'category_budgets',
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

export async function wipeAllAppData(): Promise<void> {
  await initDb();
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM expenses;
    DELETE FROM app_settings;
  `);
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
  photoUri?: string;
  monthlyBudgetCents: number;
  categoryBudgets: BudgetCategory[];
  onboardingComplete: boolean;
};

function categoriesFromLegacyBudget(monthlyBudget: string | null): BudgetCategory[] {
  const budgetCents = Number(monthlyBudget ?? 0);
  if (!Number.isSafeInteger(budgetCents) || budgetCents <= 0) return DEFAULT_BUDGET_CATEGORIES;
  const share = Math.floor(budgetCents / DEFAULT_BUDGET_CATEGORIES.length);
  let remainder = budgetCents - share * DEFAULT_BUDGET_CATEGORIES.length;
  return DEFAULT_BUDGET_CATEGORIES.map((category) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { ...category, budgetCents: share + extra };
  });
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const [name, photoUri, monthlyBudget, categoryBudgetsJson, onboardingComplete] = await Promise.all([
    getSetting(SETTINGS_KEYS.userName),
    getSetting(SETTINGS_KEYS.userPhotoUri),
    getSetting(SETTINGS_KEYS.monthlyBudgetCents),
    getSetting(SETTINGS_KEYS.categoryBudgets),
    getSetting(SETTINGS_KEYS.onboardingComplete),
  ]);
  const categoryBudgets = parseBudgetCategoriesJson(categoryBudgetsJson) ?? categoriesFromLegacyBudget(monthlyBudget);
  const monthlyBudgetCents = totalCategoryBudgetCents(categoryBudgets);
  if (onboardingComplete !== 'true' || !name?.trim() || monthlyBudgetCents <= 0) {
    return null;
  }
  return {
    name: name.trim(),
    photoUri: photoUri?.trim() || undefined,
    monthlyBudgetCents,
    categoryBudgets,
    onboardingComplete: true,
  };
}

export async function saveUserProfile(name: string, categoryBudgets: BudgetCategory[]): Promise<UserProfile> {
  const trimmedName = name.trim();
  const normalizedCategories = normalizeBudgetCategories(categoryBudgets);
  const monthlyBudgetCents = totalCategoryBudgetCents(normalizedCategories);
  if (!trimmedName) throw new Error('Enter your name.');
  if (normalizedCategories.length === 0 || monthlyBudgetCents <= 0) throw new Error('Set at least one category budget.');

  await Promise.all([
    setSetting(SETTINGS_KEYS.userName, trimmedName),
    setSetting(SETTINGS_KEYS.monthlyBudgetCents, String(monthlyBudgetCents)),
    setSetting(SETTINGS_KEYS.categoryBudgets, JSON.stringify(normalizedCategories)),
    setSetting(SETTINGS_KEYS.onboardingComplete, 'true'),
  ]);

  return {
    name: trimmedName,
    photoUri: (await getSetting(SETTINGS_KEYS.userPhotoUri))?.trim() || undefined,
    monthlyBudgetCents,
    categoryBudgets: normalizedCategories,
    onboardingComplete: true,
  };
}
