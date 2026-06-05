import { getDatabase } from './database';
import { migrateDb } from './migrations';
import { getPreferredCurrencyCode } from './settingsRepo';
import { createId } from '../lib/ids';
import { itemizedValuesToExpenseDrafts } from '../lib/expenseDrafts';
import type { CategoryBreakdown, Expense, ExpenseFormValues, ExpenseLineItem } from '../types/expense';
import type { DateRange } from '../lib/dateFilter';

let initPromise: Promise<void> | null = null;

type ExpenseRow = {
  id: string;
  amount_cents: number;
  currency: string;
  category_id: Expense['categoryId'];
  note: string;
  items_json: string | null;
  spent_on: string;
  spent_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type CategoryBreakdownRow = {
  category_id: Expense['categoryId'];
  amount_cents: number;
  count: number;
};

function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amountCents: row.amount_cents,
    currency: row.currency,
    categoryId: row.category_id,
    note: row.note,
    items: parseItemsJson(row.items_json, row.note, row.amount_cents),
    spentOn: row.spent_on,
    spentAt: row.spent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function parseItemsJson(itemsJson: string | null, note: string, amountCents: number): ExpenseLineItem[] {
  if (itemsJson) {
    try {
      const parsed = JSON.parse(itemsJson) as unknown;
      if (Array.isArray(parsed)) {
        const items = parsed
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const label = typeof (item as { label?: unknown }).label === 'string' ? (item as { label: string }).label.trim() : '';
            const itemAmount = Number((item as { amountCents?: unknown }).amountCents);
            if (!label || !Number.isFinite(itemAmount) || itemAmount <= 0) return null;
            return { label, amountCents: Math.round(itemAmount) } satisfies ExpenseLineItem;
          })
          .filter((item): item is ExpenseLineItem => Boolean(item));
        if (items.length > 0) return items;
      }
    } catch {
      // fall through to legacy single-item fallback
    }
  }

  return [{ label: note || 'Expense', amountCents }];
}

export async function initDb(): Promise<void> {
  initPromise ??= (async () => {
    const db = await getDatabase();
    await migrateDb(db);
  })();
  await initPromise;
}

export async function listExpenses(month?: string): Promise<Expense[]> {
  await initDb();
  const db = await getDatabase();
  const sql = month
    ? `SELECT * FROM expenses WHERE deleted_at IS NULL AND spent_on >= ? AND spent_on < ? ORDER BY spent_on DESC, created_at DESC`
    : `SELECT * FROM expenses WHERE deleted_at IS NULL ORDER BY spent_on DESC, created_at DESC`;
  const params = month ? [monthStart(month), nextMonthStart(month)] : [];
  const rows = await db.getAllAsync<ExpenseRow>(sql, params);
  return rows.map(rowToExpense);
}

export async function getRecentExpenses(limit = 5): Promise<Expense[]> {
  await initDb();
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExpenseRow>(
    'SELECT * FROM expenses WHERE deleted_at IS NULL ORDER BY spent_on DESC, created_at DESC LIMIT ?',
    [limit],
  );
  return rows.map(rowToExpense);
}

export async function listExpensesForRange(range: DateRange): Promise<Expense[]> {
  await initDb();
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExpenseRow>(
    `SELECT * FROM expenses WHERE deleted_at IS NULL AND spent_on >= ? AND spent_on <= ? ORDER BY spent_on DESC, created_at DESC`,
    [range.startDate, range.endDate],
  );
  return rows.map(rowToExpense);
}

export async function getRecentExpensesForRange(range: DateRange, limit = 5): Promise<Expense[]> {
  await initDb();
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExpenseRow>(
    `SELECT * FROM expenses WHERE deleted_at IS NULL AND spent_on >= ? AND spent_on <= ? ORDER BY spent_on DESC, created_at DESC LIMIT ?`,
    [range.startDate, range.endDate, limit],
  );
  return rows.map(rowToExpense);
}

export async function getExpense(id: string): Promise<Expense | null> {
  await initDb();
  const db = await getDatabase();
  const row = await db.getFirstAsync<ExpenseRow>(
    'SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
  return row ? rowToExpense(row) : null;
}

function spentAtFromDate(spentOn: string): string {
  return new Date(`${spentOn}T12:00:00`).toISOString();
}

export async function createExpenses(values: ExpenseFormValues, currency?: string): Promise<Expense[]> {
  await initDb();
  const now = new Date().toISOString();
  const effectiveCurrency = (currency ?? await getPreferredCurrencyCode()).trim().toUpperCase();
  const drafts = itemizedValuesToExpenseDrafts(values, effectiveCurrency);
  const expenses = drafts.map((draft, index) => ({
    id: createId(),
    amountCents: draft.amountCents,
    currency: draft.currency,
    categoryId: draft.categoryId,
    note: draft.note,
    items: values.groupNote.trim() ? values.items.map((item) => ({
      label: item.label.trim(),
      amountCents: Math.round(Number.parseFloat(item.amount) * 100),
    })).filter((item) => item.label && item.amountCents > 0) : [{ label: draft.note, amountCents: draft.amountCents }],
    spentOn: draft.spentOn,
    spentAt: spentAtFromDate(draft.spentOn),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  } satisfies Expense));

  const db = await getDatabase();
  for (const expense of expenses) {
    await db.runAsync(
      `INSERT INTO expenses (id, amount_cents, currency, category_id, note, items_json, spent_on, spent_at, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        expense.id,
        expense.amountCents,
        expense.currency,
        expense.categoryId,
        expense.note,
        JSON.stringify(expense.items),
        expense.spentOn,
        expense.spentAt,
        expense.createdAt,
        expense.updatedAt,
      ],
    );
  }
  return expenses;
}

export async function createExpense(values: ExpenseFormValues, currency?: string): Promise<Expense> {
  const expenses = await createExpenses(values, currency);
  const expense = expenses[0];
  if (!expense) throw new Error('Add at least one item.');
  return expense;
}

export async function updateExpense(id: string, values: ExpenseFormValues, currency?: string): Promise<Expense> {
  await initDb();
  const updatedAt = new Date().toISOString();
  const existingExpense = await getExpense(id);
  if (!existingExpense) throw new Error('Expense not found.');
  const effectiveCurrency = (currency ?? existingExpense.currency).trim().toUpperCase();
  const draft = itemizedValuesToExpenseDrafts(values, effectiveCurrency)[0];
  if (!draft) throw new Error('Add at least one item.');
  const spentAt = spentAtFromDate(draft.spentOn);
  const db = await getDatabase();
  const items = values.groupNote.trim()
    ? values.items.map((item) => ({
        label: item.label.trim(),
        amountCents: Math.round(Number.parseFloat(item.amount) * 100),
      })).filter((item): item is ExpenseLineItem => item.label.length > 0 && item.amountCents > 0)
    : [{ label: draft.note, amountCents: draft.amountCents }];
  await db.runAsync(
    `UPDATE expenses
     SET amount_cents = ?, currency = ?, category_id = ?, note = ?, items_json = ?, spent_on = ?, spent_at = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [draft.amountCents, draft.currency, draft.categoryId, draft.note, JSON.stringify(items), draft.spentOn, spentAt, updatedAt, id],
  );
  const expense = await getExpense(id);
  if (!expense) throw new Error('Expense not found.');
  return expense;
}

export async function updateExpenseItem(id: string, itemIndex: number, item: ExpenseLineItem): Promise<Expense> {
  await initDb();
  const expense = await getExpense(id);
  if (!expense) throw new Error('Expense not found.');
  const items = [...expense.items];
  if (!items[itemIndex]) throw new Error('Item not found.');
  items[itemIndex] = { label: item.label.trim(), amountCents: item.amountCents };
  const filtered = items.filter((entry) => entry.label && entry.amountCents > 0);
  if (filtered.length === 0) throw new Error('Add at least one item.');
  const amountCents = filtered.reduce((total, entry) => total + entry.amountCents, 0);
  const db = await getDatabase();
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `UPDATE expenses
     SET amount_cents = ?, items_json = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [amountCents, JSON.stringify(filtered), updatedAt, id],
  );
  const updated = await getExpense(id);
  if (!updated) throw new Error('Expense not found.');
  return updated;
}

export async function deleteExpenseItem(id: string, itemIndex: number): Promise<Expense | null> {
  await initDb();
  const expense = await getExpense(id);
  if (!expense) throw new Error('Expense not found.');
  const items = expense.items.filter((_, index) => index !== itemIndex);
  if (items.length === 0) {
    await deleteExpense(id);
    return null;
  }
  const amountCents = items.reduce((total, entry) => total + entry.amountCents, 0);
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE expenses
     SET amount_cents = ?, items_json = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [amountCents, JSON.stringify(items), new Date().toISOString(), id],
  );
  return getExpense(id);
}

export async function deleteExpense(id: string): Promise<void> {
  await initDb();
  const db = await getDatabase();
  await db.runAsync('UPDATE expenses SET deleted_at = ?, updated_at = ? WHERE id = ?', [
    new Date().toISOString(),
    new Date().toISOString(),
    id,
  ]);
}

export async function clearExpenses(): Promise<void> {
  await initDb();
  const db = await getDatabase();
  await db.runAsync('UPDATE expenses SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL', [
    new Date().toISOString(),
    new Date().toISOString(),
  ]);
}

export async function getMonthlyTotal(month: string): Promise<number> {
  await initDb();
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount_cents), 0) as total FROM expenses
     WHERE deleted_at IS NULL AND spent_on >= ? AND spent_on < ?`,
    [monthStart(month), nextMonthStart(month)],
  );
  return row?.total ?? 0;
}

export async function getTotalForRange(range: DateRange): Promise<number> {
  await initDb();
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount_cents), 0) as total FROM expenses
     WHERE deleted_at IS NULL AND spent_on >= ? AND spent_on <= ?`,
    [range.startDate, range.endDate],
  );
  return row?.total ?? 0;
}

export async function getCategoryBreakdown(month: string): Promise<CategoryBreakdown[]> {
  await initDb();
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryBreakdownRow>(
    `SELECT category_id, COALESCE(SUM(amount_cents), 0) as amount_cents, COUNT(*) as count
     FROM expenses
     WHERE deleted_at IS NULL AND spent_on >= ? AND spent_on < ?
     GROUP BY category_id
     ORDER BY amount_cents DESC`,
    [monthStart(month), nextMonthStart(month)],
  );
  return rows.map((row) => ({ categoryId: row.category_id, amountCents: row.amount_cents, count: row.count }));
}

export async function getCategoryBreakdownForRange(range: DateRange): Promise<CategoryBreakdown[]> {
  await initDb();
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryBreakdownRow>(
    `SELECT category_id, COALESCE(SUM(amount_cents), 0) as amount_cents, COUNT(*) as count
     FROM expenses
     WHERE deleted_at IS NULL AND spent_on >= ? AND spent_on <= ?
     GROUP BY category_id
     ORDER BY amount_cents DESC`,
    [range.startDate, range.endDate],
  );
  return rows.map((row) => ({ categoryId: row.category_id, amountCents: row.amount_cents, count: row.count }));
}

function monthStart(month: string): string {
  return `${month}-01`;
}

function nextMonthStart(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}
