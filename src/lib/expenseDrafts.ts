import type { ExpenseDraft, ExpenseFormValues } from '../types/expense';
import { parseMoneyToCents } from './currency';

export function itemizedValuesToExpenseDrafts(values: ExpenseFormValues, currency = 'USD'): ExpenseDraft[] {
  return values.items.map((item) => ({
    amountCents: parseMoneyToCents(item.amount),
    currency,
    categoryId: values.categoryId,
    note: item.label.trim(),
    spentOn: values.spentOn,
  }));
}

export function totalItemAmountCents(values: ExpenseFormValues): number {
  return itemizedValuesToExpenseDrafts(values).reduce((total, draft) => total + draft.amountCents, 0);
}
