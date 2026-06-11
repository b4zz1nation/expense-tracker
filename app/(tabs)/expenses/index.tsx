import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../../src/components/EmptyState';
import { ExpenseItem } from '../../../src/components/ExpenseItem';
import { Screen } from '../../../src/components/Screen';
import { TotalBudgetCard } from '../../../src/components/TotalBudgetCard';
import { CategoryIcon } from '../../../src/components/CategoryIcon';
import { formatCents } from '../../../src/lib/currency';
import { DateFilterSelector } from '../../../src/components/DateFilterSelector';
import { createDefaultDateFilter, dateFilterLabel, budgetForDateFilter } from '../../../src/lib/dateFilter';
import { useExpenses } from '../../../src/hooks/useExpenses';
import { useProfile } from '../../../src/hooks/useProfile';
import { getPreferredCurrencyCode } from '../../../src/db/settingsRepo';
import { getTotalExpenses } from '../../../src/db/expensesRepo';
import { getBudgetCategory } from '../../../src/lib/categoryBudgets';
import { useAppTheme } from '../../../src/theme/ThemeContext';

export default function ExpensesScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { colors } = theme;
  const [dateFilter, setDateFilter] = useState(createDefaultDateFilter());
  const [displayCurrencyCode, setDisplayCurrencyCode] = useState('PHP');
  const [totalExpenseCents, setTotalExpenseCents] = useState(0);
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { expenses, loading, error, refresh, categoryBreakdown } = useExpenses(dateFilter);
  const { profile, refreshProfile } = useProfile();
  const categories = profile?.categoryBudgets ?? [];

  useFocusEffect(useCallback(() => {
    void refresh();
    void refreshProfile();
    void getTotalExpenses().then(setTotalExpenseCents).catch(() => setTotalExpenseCents(0));
    void (async () => setDisplayCurrencyCode(await getPreferredCurrencyCode()))();
  }, [refresh, refreshProfile]));

  const totalBudgetCents = budgetForDateFilter(profile?.monthlyBudgetCents ?? 0, dateFilter);

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
  const selectedCategoryGroup = selectedCategoryId ? groupedCategories.find((group) => group.category.id === selectedCategoryId) : null;

  return (
    <Screen>
      <DateFilterSelector value={dateFilter} onChange={setDateFilter} />
      <View style={styles.topActions}>
        <Pressable accessibilityRole="button" onPress={() => setSelectedCategoryId('__all__')} style={({ pressed }) => [styles.viewButton, pressed && styles.pressed]}>
          <Text style={styles.viewButtonText}>View {dateFilterLabel(dateFilter)} purchases</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setAddCategoryModalOpen(true)} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <Plus color={colors.onPrimary} size={16} strokeWidth={3} />
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>
      <View style={styles.summaryStack}>
        <TotalBudgetCard spentCents={totalExpenseCents} budgetCents={totalBudgetCents} currencyCode={displayCurrencyCode} />
      </View>

      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {groupedCategories.length === 0 && !loading ? <EmptyState title="No categories yet" message="Set up category budgets in Profile." /> : null}

      {groupedCategories.map(({ category, expenses: categoryExpenses, spent, budget, remaining }) => (
        <View key={category.id} style={styles.categorySection}>
          <Pressable accessibilityRole="button" onPress={() => setSelectedCategoryId(category.id)} style={({ pressed }) => [styles.categoryHeader, pressed && styles.pressed]}>
            <View style={styles.categoryTitleRow}>
              <View style={[styles.categoryIcon, { backgroundColor: `${category.color}${theme.isDark ? '33' : '22'}` }]}><CategoryIcon categoryId={category.id} emoji={category.emoji} size={24} /></View>
              <View style={styles.categoryText}><Text style={styles.categoryTitle}>{category.name}</Text><Text style={styles.categoryMeta}>Budget {formatCents(budget, displayCurrencyCode)} · Spent {formatCents(spent, displayCurrencyCode)} · {remaining < 0 ? 'Over' : 'Left'} {formatCents(Math.abs(remaining), displayCurrencyCode)} · {categoryExpenses.length} purchase{categoryExpenses.length === 1 ? '' : 's'}</Text></View>
            </View>
            <Text style={styles.headerViewText}>View</Text>
          </Pressable>
        </View>
      ))}

      <Modal visible={Boolean(selectedCategoryId)} transparent animationType="fade" onRequestClose={() => setSelectedCategoryId(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedCategoryId(null)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>{selectedCategoryId === '__all__' ? 'Purchases' : selectedCategoryGroup?.category.name ?? 'Purchases'}</Text>
                <Text style={styles.modalSubtitle}>{dateFilterLabel(dateFilter)} · {formatCents(selectedCategoryId === '__all__' ? expenses.reduce((sum, expense) => sum + expense.amountCents, 0) : selectedCategoryGroup?.spent ?? 0, displayCurrencyCode)}</Text>
              </View>
              <Pressable onPress={() => setSelectedCategoryId(null)} accessibilityRole="button" style={styles.closeButton}>
                <X color={colors.textMuted} size={20} strokeWidth={2.6} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalListContent}>
              {(selectedCategoryId === '__all__' ? expenses : selectedCategoryGroup?.expenses ?? []).length === 0 ? (
                <EmptyState title="No purchases" message="No purchases were found for this active filter." />
              ) : (selectedCategoryId === '__all__' ? expenses : selectedCategoryGroup?.expenses ?? []).map((expense) => (
                <ExpenseItem key={expense.id} expense={expense} currencyCode={displayCurrencyCode} categories={categories} onPress={() => { setSelectedCategoryId(null); router.push(`/expenses/${expense.id}`); }} />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={addCategoryModalOpen} transparent animationType="fade" onRequestClose={() => setAddCategoryModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddCategoryModalOpen(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Choose category first</Text>
                <Text style={styles.modalSubtitle}>Your expense will start with this category selected.</Text>
              </View>
              <Pressable onPress={() => setAddCategoryModalOpen(false)} accessibilityRole="button" style={styles.closeButton}>
                <X color={colors.textMuted} size={20} strokeWidth={2.6} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalListContent}>
              {categories.map((category) => (
                <Pressable key={category.id} style={styles.modalRow} onPress={() => { setAddCategoryModalOpen(false); router.push(`/expenses/new?categoryId=${encodeURIComponent(category.id)}`); }}>
                  <View style={styles.modalLeft}>
                    <CategoryIcon categoryId={category.id} emoji={category.emoji} size={28} />
                    <View style={styles.modalHeaderText}>
                      <Text style={styles.modalRowTitle}>{category.name}</Text>
                      <Text style={styles.modalSubtitle}>Budget {formatCents(budgetForDateFilter(category.budgetCents, dateFilter), displayCurrencyCode)}</Text>
                    </View>
                  </View>
                  <Plus color={colors.primary} size={20} strokeWidth={2.7} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    summaryStack: { gap: 10 }, summaryRow: { flexDirection: 'row', gap: 10 }, error: { color: colors.expense, fontWeight: '700' }, pressed: { opacity: 0.82 },
    topActions: { alignItems: 'center', flexDirection: 'row', gap: 10 }, addButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 999, flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 11 }, addButtonText: { color: colors.onPrimary, fontWeight: '900' }, viewButton: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, flex: 1, paddingHorizontal: 14, paddingVertical: 11 }, viewButtonText: { color: colors.primaryPressed, fontWeight: '900', textAlign: 'center' },
    categorySection: { gap: 10 }, categoryHeader: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.card }, categoryTitleRow: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12, minWidth: 0 }, categoryIcon: { alignItems: 'center', borderRadius: 16, height: 46, justifyContent: 'center', width: 46 }, categoryText: { flex: 1, gap: 3, minWidth: 0 }, categoryTitle: { color: colors.text, fontSize: 18, fontWeight: '900' }, categoryMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '700', lineHeight: 17 }, headerViewText: { color: colors.primary, fontWeight: '900' }, emptyCategory: { color: colors.textMuted, fontWeight: '700', paddingHorizontal: 4 },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', paddingHorizontal: 16 }, modalCard: { backgroundColor: colors.surface, borderRadius: 24, gap: 14, maxHeight: '82%', padding: 18 }, modalHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 }, modalHeaderText: { flex: 1, gap: 2, minWidth: 0 }, modalTitle: { color: colors.text, fontSize: 20, fontWeight: '900' }, modalSubtitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600' }, closeButton: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 999, height: 36, justifyContent: 'center', width: 36 }, modalList: { marginHorizontal: -8 }, modalListContent: { gap: 10, paddingBottom: 10, paddingHorizontal: 8 }, modalRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, justifyContent: 'space-between', padding: 16 }, modalLeft: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12 }, modalRowTitle: { color: colors.text, fontWeight: '800' },
  });
}
