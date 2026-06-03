import type { CategoryId } from '../constants/categories';

export type Expense = {
  id: string;
  amountCents: number;
  currency: string;
  categoryId: CategoryId;
  note: string;
  spentOn: string;
  spentAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ExpenseFormItem = {
  id?: string;
  label: string;
  amount: string;
};

export type ExpenseFormValues = {
  categoryId: CategoryId;
  spentOn: string;
  items: ExpenseFormItem[];
};

export type ExpenseDraft = {
  amountCents: number;
  currency: string;
  categoryId: CategoryId;
  note: string;
  spentOn: string;
};

export type CategoryBreakdown = {
  categoryId: CategoryId;
  amountCents: number;
  count: number;
};
