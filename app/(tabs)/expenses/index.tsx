import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../../src/components/EmptyState';
import { ExpenseItem } from '../../../src/components/ExpenseItem';
import { MiniStatCard } from '../../../src/components/MiniStatCard';
import { Screen } from '../../../src/components/Screen';
import { CategoryIcon } from '../../../src/components/CategoryIcon';
import { formatCents } from '../../../src/lib/currency';
import { DateFilterSelector } from '../../../src/components/DateFilterSelector';
import { budgetForDateFilter, createDefaultDateFilter, dateFilterBudgetLabel, dateFilterLabel } from '../../../src/lib/dateFilter';
import { useExpenses } from '../../../src/hooks/useExpenses';
import { useProfile } from '../../../src/hooks/useProfile';
import { getPreferredCurrencyCode } from '../../../src/db/settingsRepo';
import { getBudgetCategory } from '../../../src/lib/categoryBudgets';
import { useAppTheme } from '../../../src/theme/ThemeContext';

export default function ExpensesScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { colors } = theme;
  const [dateFilter, setDateFilter] = useState(createDefaultDateFilter());
  const [displayCurrencyCode, setDisplayCurrencyCode] = useState('PHP');
  const { expenses, loading, error, refresh, monthlyTotal, categoryBreakdown } = useExpenses(dateFilter);
  const { profile, refreshProfile } = useProfile();
  const categories = profile?.categoryBudgets ?? [];

  useFocusEffect(useCallback(() => {
    void refresh();
    void refreshProfile();
    void (async () => setDisplayCurrencyCode(await getPreferredCurrencyCode()))();
  }, [refresh, refreshProfile]));

  const activeBudgetCents = profile ? budgetForDateFilter(profile.monthlyBudgetCents, dateFilter) : 0;
  const remainingBudgetCents = activeBudgetCents - monthlyTotal;
  const isOverBudget = profile ? remainingBudgetCents < 0 : false;

  const groupedCategories = useMemo(() => {
    const spentById = new Map(categoryBreakdown.map((item) => [item.categoryId, item]));
    const expenseByCategory = new Map<string, typeof expenses>();
    expenses.forEach((expense) => {
      const group = expenseByCategory.get(expense.categoryId) ?? [];
      group.push(expense);
      expenseByCategory.set(expense.categoryId, group);
    });
    const ids = new Set([...categories.map((category) => category.id), ...expenses.map((expense) => expense.categoryId)]);
    return Array.from(ids).map((id) => {
      const category = getBudgetCategory(categories, id);
      const spent = spentById.get(id)?.amountCents ?? 0;
      const periodBudget = budgetForDateFilter(category.budgetCents, dateFilter);
      return { category, expenses: expenseByCategory.get(id) ?? [], spent, budget: periodBudget, remaining: periodBudget - spent };
    }).sort((a, b) => b.spent - a.spent || b.budget - a.budget);
  }, [categories, categoryBreakdown, dateFilter, expenses]);

  return (
    <Screen>
      <DateFilterSelector value={dateFilter} onChange={setDateFilter} />
      <View style={styles.summaryStack}>
        <MiniStatCard label="Total" value={formatCents(monthlyTotal, displayCurrencyCode)} helper={dateFilterLabel(dateFilter)} tone="primary" />
        {profile ? <View style={styles.summaryRow}><MiniStatCard label="Budget" value={formatCents(activeBudgetCents, displayCurrencyCode)} helper={dateFilterBudgetLabel(dateFilter)} tone="income" /><MiniStatCard label={isOverBudget ? 'Over budget' : 'Remaining'} value={formatCents(Math.abs(remainingBudgetCents), displayCurrencyCode)} helper={dateFilterLabel(dateFilter)} tone={isOverBudget ? 'expense' : 'warning'} /></View> : null}
      </View>

      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {groupedCategories.length === 0 && !loading ? <EmptyState title="No categories yet" message="Set up category budgets in Profile." /> : null}

      {groupedCategories.map(({ category, expenses: categoryExpenses, spent, budget, remaining }) => (
        <View key={category.id} style={styles.categorySection}>
          <Pressable accessibilityRole="button" onPress={() => router.push(`/categories/${encodeURIComponent(category.id)}`)} style={({ pressed }) => [styles.categoryHeader, pressed && styles.pressed]}>
            <View style={styles.categoryTitleRow}>
              <View style={[styles.categoryIcon, { backgroundColor: `${category.color}${theme.isDark ? '33' : '22'}` }]}><CategoryIcon categoryId={category.id} emoji={category.emoji} size={24} /></View>
              <View style={styles.categoryText}><Text style={styles.categoryTitle}>{category.name}</Text><Text style={styles.categoryMeta}>Budget {formatCents(budget, displayCurrencyCode)} · Spent {formatCents(spent, displayCurrencyCode)} · {remaining < 0 ? 'Over' : 'Left'} {formatCents(Math.abs(remaining), displayCurrencyCode)}</Text></View>
            </View>
            <Plus color={colors.primary} size={20} strokeWidth={2.7} />
          </Pressable>
          {categoryExpenses.length === 0 ? <Text style={styles.emptyCategory}>No expenses in this category for this period.</Text> : categoryExpenses.map((expense) => <ExpenseItem key={expense.id} expense={expense} currencyCode={displayCurrencyCode} categories={categories} onPress={() => router.push(`/expenses/${expense.id}`)} />)}
        </View>
      ))}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    summaryStack: { gap: 10 }, summaryRow: { flexDirection: 'row', gap: 10 }, error: { color: colors.expense, fontWeight: '700' }, pressed: { opacity: 0.82 },
    categorySection: { gap: 10 }, categoryHeader: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.card }, categoryTitleRow: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12, minWidth: 0 }, categoryIcon: { alignItems: 'center', borderRadius: 16, height: 46, justifyContent: 'center', width: 46 }, categoryText: { flex: 1, gap: 3, minWidth: 0 }, categoryTitle: { color: colors.text, fontSize: 18, fontWeight: '900' }, categoryMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '700', lineHeight: 17 }, emptyCategory: { color: colors.textMuted, fontWeight: '700', paddingHorizontal: 4 },
  });
}
