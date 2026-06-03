import { getDatabase } from './database';
import { migrateDb } from './migrations';
import { getDeviceDefaultCurrencyCode } from '../lib/currencies';

let initPromise: Promise<void> | null = null;

const SETTINGS_KEYS = {
  preferredCurrency: 'preferred_currency',
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
