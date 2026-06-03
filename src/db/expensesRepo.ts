import { getDatabase } from './database';
import { migrateDb } from './migrations';
import { createId } from '../lib/ids';
import { itemizedValuesToExpenseDrafts } from '../lib/expenseDrafts';
import type { CategoryBreakdown, Expense, ExpenseFormValues } from '../types/expense';

let initPromise: Promise<void> | null = null;

type ExpenseRow = {
  id: string;
  amount_cents: number;
  currency: string;
  category_id: Expense['categoryId'];
  note: string;
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
    spentOn: row.spent_on,
    spentAt: row.spent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
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

export async function createExpenses(values: ExpenseFormValues, currency = 'USD'): Promise<Expense[]> {
  await initDb();
  const now = new Date().toISOString();
  const drafts = itemizedValuesToExpenseDrafts(values, currency);
  const expenses = drafts.map((draft) => ({
    id: createId(),
    amountCents: draft.amountCents,
    currency: draft.currency,
    categoryId: draft.categoryId,
    note: draft.note,
    spentOn: draft.spentOn,
    spentAt: spentAtFromDate(draft.spentOn),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  } satisfies Expense));

  const db = await getDatabase();
  for (const expense of expenses) {
    await db.runAsync(
      `INSERT INTO expenses (id, amount_cents, currency, category_id, note, spent_on, spent_at, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        expense.id,
        expense.amountCents,
        expense.currency,
        expense.categoryId,
        expense.note,
        expense.spentOn,
        expense.spentAt,
        expense.createdAt,
        expense.updatedAt,
      ],
    );
  }
  return expenses;
}

export async function createExpense(values: ExpenseFormValues, currency = 'USD'): Promise<Expense> {
  const expenses = await createExpenses(values, currency);
  const expense = expenses[0];
  if (!expense) throw new Error('Add at least one item.');
  return expense;
}

export async function updateExpense(id: string, values: ExpenseFormValues, currency = 'USD'): Promise<Expense> {
  await initDb();
  const updatedAt = new Date().toISOString();
  const draft = itemizedValuesToExpenseDrafts(values, currency)[0];
  if (!draft) throw new Error('Add at least one item.');
  const spentAt = spentAtFromDate(draft.spentOn);
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE expenses
     SET amount_cents = ?, currency = ?, category_id = ?, note = ?, spent_on = ?, spent_at = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [draft.amountCents, draft.currency, draft.categoryId, draft.note, draft.spentOn, spentAt, updatedAt, id],
  );
  const expense = await getExpense(id);
  if (!expense) throw new Error('Expense not found.');
  return expense;
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

function monthStart(month: string): string {
  return `${month}-01`;
}

function nextMonthStart(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}
