import type { BudgetCategory } from '../types/categoryBudget';

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: 'food', name: 'Food', emoji: '🍔', color: '#F97316', budgetCents: 0, isDefault: true },
  { id: 'utilities', name: 'Utilities', emoji: '⚡️', color: '#EAB308', budgetCents: 0, isDefault: true },
  { id: 'bills', name: 'Bills', emoji: '📄', color: '#EF4444', budgetCents: 0, isDefault: true },
  { id: 'other', name: 'Others', emoji: '🛒', color: '#64748B', budgetCents: 0, isDefault: true },
];

const LEGACY_CATEGORY_INFO: Record<string, Omit<BudgetCategory, 'budgetCents'>> = {
  transport: { id: 'transport', name: 'Transport', emoji: '🚗', color: '#3B82F6' },
  shopping: { id: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#A855F7' },
  entertainment: { id: 'entertainment', name: 'Entertainment', emoji: '🎬', color: '#EC4899' },
  health: { id: 'health', name: 'Health', emoji: '🏥', color: '#22C55E' },
  travel: { id: 'travel', name: 'Travel', emoji: '✈️', color: '#14B8A6' },
};

const COLORS = ['#F97316', '#EAB308', '#EF4444', '#64748B', '#3B82F6', '#A855F7', '#22C55E', '#EC4899', '#14B8A6'];

export function createCategoryId(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug ? `custom-${slug}-${Date.now().toString(36)}` : `custom-category-${Date.now().toString(36)}`;
}

export function normalizeBudgetCategories(categories: BudgetCategory[]): BudgetCategory[] {
  const seen = new Set<string>();
  return categories
    .map((category, index) => ({
      ...category,
      id: category.id.trim(),
      name: category.name.trim(),
      emoji: category.emoji.trim() || '🧾',
      color: category.color || COLORS[index % COLORS.length],
      budgetCents: Number.isSafeInteger(category.budgetCents) && category.budgetCents >= 0 ? category.budgetCents : 0,
    }))
    .filter((category) => category.id && category.name && !seen.has(category.id) && seen.add(category.id));
}

export function totalCategoryBudgetCents(categories: BudgetCategory[]): number {
  return categories.reduce((total, category) => total + category.budgetCents, 0);
}

export function getBudgetCategory(categories: BudgetCategory[] | undefined | null, categoryId: string): BudgetCategory {
  const match = categories?.find((category) => category.id === categoryId);
  if (match) return match;
  const defaultMatch = DEFAULT_BUDGET_CATEGORIES.find((category) => category.id === categoryId);
  if (defaultMatch) return defaultMatch;
  const legacy = LEGACY_CATEGORY_INFO[categoryId];
  if (legacy) return { ...legacy, budgetCents: 0 };
  return { id: categoryId, name: 'Category', emoji: '🧾', color: '#64748B', budgetCents: 0 };
}

export function parseBudgetCategoriesJson(value: string | null): BudgetCategory[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as BudgetCategory[];
    if (!Array.isArray(parsed)) return null;
    return normalizeBudgetCategories(parsed);
  } catch {
    return null;
  }
}
