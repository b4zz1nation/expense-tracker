import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../src/components/AppButton';
import { EmptyState } from '../../../src/components/EmptyState';
import { ExpenseItem } from '../../../src/components/ExpenseItem';
import { MiniStatCard } from '../../../src/components/MiniStatCard';
import { Screen } from '../../../src/components/Screen';
import { formatCents } from '../../../src/lib/currency';
import { DateFilterSelector } from '../../../src/components/DateFilterSelector';
import { budgetForDateFilter, createDefaultDateFilter, dateFilterBudgetLabel, dateFilterLabel } from '../../../src/lib/dateFilter';
import { useExpenses } from '../../../src/hooks/useExpenses';
import { useProfile } from '../../../src/hooks/useProfile';
import { getPreferredCurrencyCode } from '../../../src/db/settingsRepo';
import { useAppTheme } from '../../../src/theme/ThemeContext';

export default function ExpensesScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [dateFilter, setDateFilter] = useState(createDefaultDateFilter());
  const [displayCurrencyCode, setDisplayCurrencyCode] = useState('USD');
  const { expenses, loading, error, refresh, monthlyTotal } = useExpenses(dateFilter);
  const { profile, refreshProfile } = useProfile();

  useFocusEffect(useCallback(() => {
    void refresh();
    void refreshProfile();
  }, [refresh, refreshProfile]));

  const activeBudgetCents = profile ? budgetForDateFilter(profile.monthlyBudgetCents, dateFilter) : 0;

  useFocusEffect(useCallback(() => {
    void (async () => {
      setDisplayCurrencyCode(await getPreferredCurrencyCode());
    })();
  }, []));

  const remainingBudgetCents = activeBudgetCents - monthlyTotal;
  const isOverBudget = profile ? remainingBudgetCents < 0 : false;

  return (
    <Screen>
      <DateFilterSelector value={dateFilter} onChange={setDateFilter} />
      <View style={styles.summaryStack}>
        <MiniStatCard
          label="Total"
          value={formatCents(monthlyTotal, displayCurrencyCode)}
          helper={dateFilterLabel(dateFilter)}
          tone="primary"
        />
        {profile ? (
          <View style={styles.summaryRow}>
            <MiniStatCard
              label="Budget"
              value={formatCents(activeBudgetCents, displayCurrencyCode)}
              helper={dateFilterBudgetLabel(dateFilter)}
              tone="income"
            />
            <MiniStatCard
              label={isOverBudget ? 'Over budget' : 'Remaining'}
              value={formatCents(Math.abs(remainingBudgetCents), displayCurrencyCode)}
              helper={dateFilterLabel(dateFilter)}
              tone={isOverBudget ? 'expense' : 'warning'}
            />
          </View>
        ) : null}
      </View>
      <View style={styles.addButtonRow}>
        <AppButton onPress={() => router.push('/expenses/new')} style={styles.addButton} variant="secondary">
          Add Expense
        </AppButton>
      </View>
      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {expenses.length === 0 && !loading ? (
        <EmptyState title="No expenses in this period" message="Add an expense or choose another date range." actionLabel="Add Expense" onAction={() => router.push('/expenses/new')} />
      ) : (
        expenses.map((expense) => <ExpenseItem key={expense.id} expense={expense} currencyCode={displayCurrencyCode} onPress={() => router.push(`/expenses/${expense.id}`)} />)
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors } = theme;
  return StyleSheet.create({
  summaryStack: { gap: 10 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  addButtonRow: { alignItems: 'flex-end' },
  addButton: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  error: { color: colors.expense, fontWeight: '700' },
  });
}
