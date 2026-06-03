import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../src/components/AppButton';
import { EmptyState } from '../../../src/components/EmptyState';
import { ExpenseItem } from '../../../src/components/ExpenseItem';
import { Screen } from '../../../src/components/Screen';
import { currentMonthString, monthLabel, shiftMonth } from '../../../src/lib/dates';
import { useExpenses } from '../../../src/hooks/useExpenses';

export default function ExpensesScreen() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonthString());
  const { expenses, loading, error, refresh } = useExpenses(month);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  return (
    <Screen>
      <View style={styles.monthRow}>
        <Text style={styles.monthArrow} onPress={() => setMonth((current) => shiftMonth(current, -1))}>‹</Text>
        <Text style={styles.month}>{monthLabel(month)}</Text>
        <Text style={styles.monthArrow} onPress={() => setMonth((current) => shiftMonth(current, 1))}>›</Text>
      </View>
      <AppButton onPress={() => router.push('/expenses/new')}>Add Expense</AppButton>
      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {expenses.length === 0 && !loading ? (
        <EmptyState title="No expenses for this month" message="Add an expense or switch months." actionLabel="Add Expense" onAction={() => router.push('/expenses/new')} />
      ) : (
        expenses.map((expense) => <ExpenseItem key={expense.id} expense={expense} onPress={() => router.push(`/expenses/${expense.id}`)} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  month: { color: '#0F172A', fontWeight: '800', fontSize: 18 },
  monthArrow: { color: '#2563EB', fontSize: 34, fontWeight: '700', paddingHorizontal: 16 },
  error: { color: '#DC2626', fontWeight: '700' },
});
