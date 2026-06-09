import { DEFAULT_BUDGET_CATEGORIES, getBudgetCategory } from '../lib/categoryBudgets';
import type { BudgetCategory } from '../types/categoryBudget';

export const CATEGORIES = DEFAULT_BUDGET_CATEGORIES;
export type CategoryId = string;

export function getCategory(categoryId: string, categories?: BudgetCategory[]) {
  return getBudgetCategory(categories, categoryId);
}
