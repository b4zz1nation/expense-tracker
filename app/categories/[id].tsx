import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { DateFilterSelector } from '../../src/components/DateFilterSelector';
import { EmptyState } from '../../src/components/EmptyState';
import { ExpenseItem } from '../../src/components/ExpenseItem';
import { MiniStatCard } from '../../src/components/MiniStatCard';
import { Screen } from '../../src/components/Screen';
import { getPreferredCurrencyCode } from '../../src/db/settingsRepo';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useProfile } from '../../src/hooks/useProfile';
import { getBudgetCategory } from '../../src/lib/categoryBudgets';
import { formatCents } from '../../src/lib/currency';
import { createDefaultDateFilter, dateFilterLabel } from '../../src/lib/dateFilter';
import { useAppTheme } from '../../src/theme/ThemeContext';

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { colors } = theme;
  const [dateFilter, setDateFilter] = useState(createDefaultDateFilter());
  const [currencyCode, setCurrencyCode] = useState('PHP');
  const { expenses, loading, error, refresh } = useExpenses(dateFilter);
  const { profile, refreshProfile } = useProfile();
  const categories = profile?.categoryBudgets ?? [];
  const categoryId = Array.isArray(id) ? id[0] : id;
  const category = getBudgetCategory(categories, categoryId ?? 'other');
  const categoryExpenses = useMemo(() => expenses.filter((expense) => expense.categoryId === category.id), [category.id, expenses]);
  const spent = categoryExpenses.reduce((total, expense) => total + expense.amountCents, 0);
  const budget = category.budgetCents;
  const remaining = budget - spent;

  useFocusEffect(useCallback(() => {
    void refresh();
    void refreshProfile();
    void (async () => setCurrencyCode(await getPreferredCurrencyCode()))();
  }, [refresh, refreshProfile]));

  return (
    <Screen>
      <View style={styles.headerCard}>
        <View style={[styles.headerIcon, { backgroundColor: `${category.color}${theme.isDark ? '33' : '22'}` }]}><CategoryIcon categoryId={category.id} emoji={category.emoji} size={34} /></View>
        <View style={styles.headerText}><Text style={styles.eyebrow}>Category</Text><Text style={styles.title}>{category.name}</Text><Text style={styles.subtitle}>New expenses from here use this category and cannot change it in the form.</Text></View>
      </View>
      <DateFilterSelector value={dateFilter} onChange={setDateFilter} />
      <View style={styles.summaryRow}><MiniStatCard label="Budget" value={formatCents(budget, currencyCode)} helper={dateFilterLabel(dateFilter)} tone="income" /><MiniStatCard label="Spent" value={formatCents(spent, currencyCode)} helper={dateFilterLabel(dateFilter)} tone="primary" /><MiniStatCard label={remaining < 0 ? 'Over' : 'Remaining'} value={formatCents(Math.abs(remaining), currencyCode)} helper={dateFilterLabel(dateFilter)} tone={remaining < 0 ? 'expense' : 'warning'} /></View>
      <Pressable onPress={() => router.push(`/expenses/new?categoryId=${encodeURIComponent(category.id)}&locked=1`)} style={({ pressed }) => [styles.addCard, pressed && styles.pressed]}><Plus color={colors.onPrimary} size={18} strokeWidth={2.8} /><Text style={styles.addText}>Add {category.name} expense</Text></Pressable>
      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {categoryExpenses.length === 0 && !loading ? <EmptyState title={`No ${category.name} expenses`} message="Add an expense for this category or choose another date range." /> : categoryExpenses.map((expense) => <ExpenseItem key={expense.id} expense={expense} currencyCode={currencyCode} categories={categories} onPress={() => router.push(`/expenses/${expense.id}`)} />)}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    headerCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 14, padding: spacing.card }, headerIcon: { alignItems: 'center', borderRadius: 22, height: 64, justifyContent: 'center', width: 64 }, headerText: { flex: 1, gap: 3 }, eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' }, title: { color: colors.text, fontSize: 24, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600', lineHeight: 19 }, summaryRow: { flexDirection: 'row', gap: 10 }, addCard: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: 999, flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 }, addText: { color: colors.onPrimary, fontWeight: '900' }, pressed: { opacity: 0.82 }, error: { color: colors.expense, fontWeight: '700' },
  });
}
