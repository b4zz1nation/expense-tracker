export type BudgetCategory = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  budgetCents: number;
  isDefault?: boolean;
};
