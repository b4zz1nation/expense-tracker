import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../src/components/AppButton';
import { EmptyState } from '../../../src/components/EmptyState';
import { ExpenseItem } from '../../../src/components/ExpenseItem';
import { Screen } from '../../../src/components/Screen';
import { StatCard } from '../../../src/components/StatCard';
import { formatCents } from '../../../src/lib/currency';
import { currentMonthString, monthLabel, shiftMonth } from '../../../src/lib/dates';
import { useExpenses } from '../../../src/hooks/useExpenses';
import { getPreferredCurrencyCode } from '../../../src/db/settingsRepo';

export default function ExpensesScreen() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonthString());
  const [displayCurrencyCode, setDisplayCurrencyCode] = useState('USD');
  const { expenses, loading, error, refresh, monthlyTotal } = useExpenses(month);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  useFocusEffect(useCallback(() => {
    void (async () => {
      setDisplayCurrencyCode(await getPreferredCurrencyCode());
    })();
  }, []));

  return (
    <Screen>
      <View style={styles.monthRow}>
        <Text style={styles.monthArrow} onPress={() => setMonth((current) => shiftMonth(current, -1))}>‹</Text>
        <Text style={styles.month}>{monthLabel(month)}</Text>
        <Text style={styles.monthArrow} onPress={() => setMonth((current) => shiftMonth(current, 1))}>›</Text>
      </View>
      <StatCard label="Total this month" value={formatCents(monthlyTotal, displayCurrencyCode)} helper="Current selected month" />
      <View style={styles.addButtonRow}>
        <AppButton onPress={() => router.push('/expenses/new')} style={styles.addButton} variant="secondary">
          Add Expense
        </AppButton>
      </View>
      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {expenses.length === 0 && !loading ? (
        <EmptyState title="No expenses for this month" message="Add an expense or switch months." actionLabel="Add Expense" onAction={() => router.push('/expenses/new')} />
      ) : (
        expenses.map((expense) => <ExpenseItem key={expense.id} expense={expense} currencyCode={displayCurrencyCode} onPress={() => router.push(`/expenses/${expense.id}`)} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  month: { color: '#0F172A', fontWeight: '800', fontSize: 18 },
  monthArrow: { color: '#2563EB', fontSize: 34, fontWeight: '700', paddingHorizontal: 16 },
  addButtonRow: { alignItems: 'flex-end' },
  addButton: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  error: { color: '#DC2626', fontWeight: '700' },
});
