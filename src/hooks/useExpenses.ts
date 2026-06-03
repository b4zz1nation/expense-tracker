import { useCallback, useEffect, useState } from 'react';
import type { CategoryBreakdown, Expense } from '../types/expense';
import { getCategoryBreakdown, getMonthlyTotal, getRecentExpenses, initDb, listExpenses } from '../db/expensesRepo';

export function useExpenses(month: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await initDb();
      const [all, recent, total, breakdown] = await Promise.all([
        listExpenses(month),
        getRecentExpenses(),
        getMonthlyTotal(month),
        getCategoryBreakdown(month),
      ]);
      setExpenses(all);
      setRecentExpenses(recent);
      setMonthlyTotal(total);
      setCategoryBreakdown(breakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load expenses.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { expenses, recentExpenses, monthlyTotal, categoryBreakdown, loading, error, refresh };
}
