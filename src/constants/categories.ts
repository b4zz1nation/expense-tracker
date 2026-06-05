export const CATEGORIES = [
  { id: 'food', name: 'Food', emoji: '🍎', color: '#F97316' },
  { id: 'transport', name: 'Transport', emoji: '🚗', color: '#3B82F6' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#A855F7' },
  { id: 'bills', name: 'Bills', emoji: '🧾', color: '#EF4444' },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎬', color: '#EC4899' },
  { id: 'health', name: 'Health', emoji: '🏥', color: '#22C55E' },
  { id: 'travel', name: 'Travel', emoji: '✈️', color: '#14B8A6' },
  { id: 'other', name: 'Other', emoji: '•', color: '#64748B' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export function getCategory(categoryId: string) {
  return CATEGORIES.find((category) => category.id === categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
}
