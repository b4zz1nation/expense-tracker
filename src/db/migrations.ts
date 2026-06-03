import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const migration = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_migrations WHERE version = 1',
  );

  if (!migration) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
        currency TEXT NOT NULL,
        category_id TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        items_json TEXT NOT NULL DEFAULT '[]',
        spent_on TEXT NOT NULL CHECK(length(spent_on) = 10),
        spent_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_expenses_spent_on ON expenses(spent_on) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_expenses_category_spent_on ON expenses(category_id, spent_on) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_expenses_currency_spent_on ON expenses(currency, spent_on) WHERE deleted_at IS NULL;
      INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (1, datetime('now'));
    `);
  }

  const migration2 = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_migrations WHERE version = 2',
  );

  if (!migration2) {
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(expenses)');
    const hasItemsJson = columns.some((column) => column.name === 'items_json');
    if (!hasItemsJson) {
      await db.execAsync("ALTER TABLE expenses ADD COLUMN items_json TEXT NOT NULL DEFAULT '[]';");
    }
    await db.execAsync(`INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (2, datetime('now'));`);
  }

  const migration3 = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_migrations WHERE version = 3',
  );

  if (!migration3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (3, datetime('now'));
    `);
  }
}
