import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CategoryBreakdown, Expense } from '../types/expense';
import {
  getCategoryBreakdownForRange,
  getRecentExpensesForRange,
  getTotalForRange,
  initDb,
  listExpensesForRange,
} from '../db/expensesRepo';
import { dateFilterToRange, type DateFilter } from '../lib/dateFilter';

export function useExpenses(filter: DateFilter) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const range = useMemo(() => dateFilterToRange(filter), [filter]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await initDb();
      const [all, recent, total, breakdown] = await Promise.all([
        listExpensesForRange(range),
        getRecentExpensesForRange(range),
        getTotalForRange(range),
        getCategoryBreakdownForRange(range),
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
  }, [range]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { expenses, recentExpenses, monthlyTotal, categoryBreakdown, loading, error, refresh };
}
