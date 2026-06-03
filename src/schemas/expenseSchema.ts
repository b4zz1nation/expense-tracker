import { z } from 'zod';
import { CATEGORIES } from '../constants/categories';
import { isDateString } from '../lib/dates';
import { parseMoneyToCents } from '../lib/currency';

const categoryIds = CATEGORIES.map((category) => category.id) as [string, ...string[]];

function isValidMoney(value: string): boolean {
  try {
    parseMoneyToCents(value);
    return true;
  } catch {
    return false;
  }
}

export const expenseItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, 'Item name is required.').max(120, 'Item name must be 120 characters or less.'),
  amount: z.string().trim().min(1, 'Item amount is required.').refine(isValidMoney, 'Enter a valid amount greater than 0.'),
});

export const expenseSchema = z.object({
  categoryId: z.enum(categoryIds),
  spentOn: z.string().refine(isDateString, 'Use YYYY-MM-DD.'),
  groupNote: z.string().trim().max(80, 'Group note must be 80 characters or less.'),
  items: z.array(expenseItemSchema).min(1, 'Add at least one item.').max(25, 'Add 25 items or fewer.'),
});

export type ExpenseSchemaValues = z.infer<typeof expenseSchema>;
