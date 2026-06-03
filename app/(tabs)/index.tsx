import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../src/components/AppButton';
import { EmptyState } from '../../src/components/EmptyState';
import { ExpenseItem } from '../../src/components/ExpenseItem';
import { Screen } from '../../src/components/Screen';
import { StatCard } from '../../src/components/StatCard';
import { getCategory } from '../../src/constants/categories';
import { formatCents } from '../../src/lib/currency';
import { currentMonthString, monthLabel, shiftMonth } from '../../src/lib/dates';
import { useExpenses } from '../../src/hooks/useExpenses';

export default function DashboardScreen() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonthString());
  const { recentExpenses, monthlyTotal, categoryBreakdown, loading, error, refresh } = useExpenses(month);

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

      <StatCard label="Total spent this month" value={formatCents(monthlyTotal)} helper="Local-first, stored on this device" />
      <AppButton onPress={() => router.push('/expenses/new')}>Add Expense</AppButton>

      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category breakdown</Text>
        {categoryBreakdown.length === 0 ? (
          <EmptyState title="No spending yet" message="Add your first expense to see a category breakdown." />
        ) : (
          categoryBreakdown.map((item) => {
            const category = getCategory(item.categoryId);
            const percent = monthlyTotal > 0 ? Math.round((item.amountCents / monthlyTotal) * 100) : 0;
            return (
              <View key={item.categoryId} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{category.emoji} {category.name}</Text>
                <Text style={styles.breakdownAmount}>{formatCents(item.amountCents)} · {percent}%</Text>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent expenses</Text>
          <Text style={styles.link} onPress={() => router.push('/expenses')}>View all</Text>
        </View>
        {recentExpenses.length === 0 ? (
          <EmptyState title="No expenses yet" message="Add your first expense to start tracking." actionLabel="Add Expense" onAction={() => router.push('/expenses/new')} />
        ) : (
          recentExpenses.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} onPress={() => router.push(`/expenses/${expense.id}`)} />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  month: { color: '#0F172A', fontWeight: '800', fontSize: 18 },
  monthArrow: { color: '#2563EB', fontSize: 34, fontWeight: '700', paddingHorizontal: 16 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  link: { color: '#2563EB', fontWeight: '800' },
  error: { color: '#DC2626', fontWeight: '700' },
  breakdownRow: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  breakdownLabel: { color: '#0F172A', fontWeight: '700' },
  breakdownAmount: { color: '#64748B', fontWeight: '700' },
});
