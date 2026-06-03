import type { ExpenseDraft, ExpenseFormValues } from '../types/expense';
import { parseMoneyToCents } from './currency';

export function itemizedValuesToExpenseDrafts(values: ExpenseFormValues, currency = 'USD'): ExpenseDraft[] {
  const drafts = values.items.map((item) => ({
    amountCents: parseMoneyToCents(item.amount),
    currency,
    categoryId: values.categoryId,
    note: item.label.trim(),
    spentOn: values.spentOn,
  }));

  const groupNote = values.groupNote.trim();
  if (!groupNote) {
    return drafts;
  }

  const totalAmountCents = drafts.reduce((total, draft) => total + draft.amountCents, 0);

  return [
    {
      amountCents: totalAmountCents,
      currency,
      categoryId: values.categoryId,
      note: groupNote,
      spentOn: values.spentOn,
    },
  ];
}

export function totalItemAmountCents(values: ExpenseFormValues): number {
  return itemizedValuesToExpenseDrafts(values).reduce((total, draft) => total + draft.amountCents, 0);
}
