import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { CalendarCheck, ChevronLeft, Plus, X } from 'lucide-react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import PagerView from 'react-native-pager-view';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/EmptyState';
import { ExpenseForm, type ExpenseFormHandle } from '../../src/components/ExpenseForm';
import { ExpenseItem } from '../../src/components/ExpenseItem';
import { Screen } from '../../src/components/Screen';
import { TotalBudgetCard } from '../../src/components/TotalBudgetCard';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { useExpenseSheet } from '../../src/context/ExpenseSheetContext';
import { getBudgetCategory } from '../../src/lib/categoryBudgets';
import { formatCents } from '../../src/lib/currency';
import { createExpenses } from '../../src/db/expensesRepo';
import { getPreferredCurrencyCode } from '../../src/db/settingsRepo';
import { DateFilterSelector } from '../../src/components/DateFilterSelector';
import { createDefaultDateFilter, dateFilterExpensesTitle, dateFilterLabel, budgetForDateFilter } from '../../src/lib/dateFilter';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useProfile } from '../../src/hooks/useProfile';
import { useAppTheme } from '../../src/theme/ThemeContext';
import type { Expense, ExpenseFormValues } from '../../src/types/expense';

export default function DashboardScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { setSheetOpen } = useExpenseSheet();
  const [dateFilter, setDateFilter] = useState(createDefaultDateFilter());
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [dayExpensesModalOpen, setDayExpensesModalOpen] = useState(false);
  const [dayAddFormKey, setDayAddFormKey] = useState(0);
  const [displayCurrencyCode, setDisplayCurrencyCode] = useState('PHP');
  const { expenses, monthlyTotal, categoryBreakdown, loading, error, refresh } = useExpenses(dateFilter);
  const { profile, refreshProfile } = useProfile();
  const expenseSheetRef = useRef<BottomSheetModal>(null);
  const dayAddFormRef = useRef<ExpenseFormHandle>(null);
  const dayModalPagerRef = useRef<PagerView>(null);
  const sheetSnapPoints = useMemo(() => ['68%', '96%'], []);
  const sheetBottomInset = Math.max(insets.bottom, 12);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void refreshProfile();
    }, [refresh, refreshProfile])
  );

  useFocusEffect(useCallback(() => {
    void (async () => {
      setDisplayCurrencyCode(await getPreferredCurrencyCode());
    })();
  }, []));

  useEffect(() => {
    if (!selectedExpense) return;

    const frame = requestAnimationFrame(() => {
      expenseSheetRef.current?.present();
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedExpense]);

  const renderSheetBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.35}
      />
    ),
    []
  );

  const openExpenseSheet = (expense: Expense) => {
    setSheetError(null);
    setSelectedExpense(expense);
    setSheetOpen(true);
  };

  const handleExpenseSheetDismiss = useCallback(() => {
    setSheetError(null);
    setSelectedExpense(null);
    setSheetOpen(false);
  }, [setSheetOpen]);

  const closeExpenseSheet = () => {
    expenseSheetRef.current?.dismiss();
  };

  const openDayExpensesModal = () => {
    setDayAddFormKey((current) => current + 1);
    setDayExpensesModalOpen(true);
    requestAnimationFrame(() => dayModalPagerRef.current?.setPageWithoutAnimation(0));
  };

  const closeDayExpensesModal = () => {
    setDayExpensesModalOpen(false);
    requestAnimationFrame(() => dayModalPagerRef.current?.setPageWithoutAnimation(0));
  };

  const showDayAddPage = () => {
    dayModalPagerRef.current?.setPage(1);
  };

  const showDayListPage = () => {
    dayModalPagerRef.current?.setPage(0);
  };

  const submitDayExpense = async (values: ExpenseFormValues) => {
    await createExpenses(values, displayCurrencyCode);
    await refresh();
    setDayAddFormKey((current) => current + 1);
    showDayListPage();
  };

  const budgetCategories = profile?.categoryBudgets ?? [];
  const categorySummaries = useMemo(() => {
    const breakdownById = new Map(categoryBreakdown.map((item) => [item.categoryId, item]));
    const ids = new Set([...budgetCategories.map((category) => category.id), ...categoryBreakdown.map((item) => item.categoryId)]);
    return Array.from(ids).map((id) => {
      const category = getBudgetCategory(budgetCategories, id);
      const breakdown = breakdownById.get(id);
      const amountCents = breakdown?.amountCents ?? 0;
      const periodBudget = budgetForDateFilter(category.budgetCents, dateFilter);
      const percent = periodBudget > 0 ? Math.min(100, Math.round((amountCents / periodBudget) * 100)) : 0;
      return { ...category, amountCents, budgetCents: periodBudget, remainingCents: periodBudget - amountCents, percent, count: breakdown?.count ?? 0 };
    }).sort((a, b) => b.amountCents - a.amountCents || b.budgetCents - a.budgetCents);
  }, [budgetCategories, categoryBreakdown, dateFilter]);

  const visibleCategorySummaries = categorySummaries.filter((item) => item.amountCents > 0 || item.budgetCents > 0);
  const dayViewExpenses = dateFilter.mode === 'day' ? expenses.filter((expense) => expense.spentOn === dateFilter.date) : [];
  const modalExpenses = dateFilter.mode === 'day' ? dayViewExpenses : expenses;
  const modalDateLabel = dateFilterLabel(dateFilter);
  const modalDefaultSpentOn = dateFilter.mode === 'day' ? dateFilter.date : undefined;
  const viewPreviewExpenses = expenses.slice(0, 3);
  const totalBudgetCents = budgetForDateFilter(profile?.monthlyBudgetCents ?? 0, dateFilter);

  return (
    <Screen>
      <DateFilterSelector value={dateFilter} onChange={setDateFilter} />

      <View style={styles.summaryStack}>
        <TotalBudgetCard spentCents={monthlyTotal} budgetCents={totalBudgetCents} currencyCode={displayCurrencyCode} />
      </View>

      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={[styles.section, styles.daySection]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconBubble}>
              <CalendarCheck color={colors.primary} size={18} strokeWidth={2.5} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>{dateFilterExpensesTitle(dateFilter)}</Text>
              <Text style={styles.sectionSubtitle}>{dateFilterLabel(dateFilter)} · {formatCents(monthlyTotal, displayCurrencyCode)}</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={openDayExpensesModal} style={styles.compactAddButton}>
            <Text style={styles.compactAddButtonText}>View</Text>
          </Pressable>
        </View>
        {dateFilter.mode === 'day' ? (
          dayViewExpenses.length === 0 && !loading ? (
            <EmptyState title="No expenses for this day" message="Use the arrows to move between days, or tap View to add from the day modal." />
          ) : (
            dayViewExpenses.map((expense) => (
              <ExpenseItem key={expense.id} expense={expense} currencyCode={displayCurrencyCode} categories={budgetCategories} onPress={() => openExpenseSheet(expense)} />
            ))
          )
        ) : viewPreviewExpenses.length === 0 && !loading ? (
          <EmptyState title="No expenses in this view" message="Use the arrows to move between periods, or tap Add for this selection." />
        ) : (
          viewPreviewExpenses.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} currencyCode={displayCurrencyCode} categories={budgetCategories} onPress={() => openExpenseSheet(expense)} />
          ))
        )}
      </View>

      <View style={[styles.section, styles.breakdownSection]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category breakdown</Text>
          <Pressable onPress={() => setCategoryModalOpen(true)} accessibilityRole="button" style={styles.sectionAction}>
            <Text style={styles.sectionActionText}>Expand</Text>
          </Pressable>
        </View>
        {visibleCategorySummaries.length === 0 ? (
          <EmptyState title="No spending in this period" message="Add your first expense to see a category breakdown." />
        ) : (
          <FlatList
            data={visibleCategorySummaries}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.breakdownRail}
            nestedScrollEnabled
            overScrollMode="always"
            bounces
            alwaysBounceHorizontal
            renderItem={({ item }) => (
              <View
                style={[styles.breakdownCard, styles.breakdownGaugeCard]}
              >
                <AnimatedCircularProgress
                  size={96}
                  width={10}
                  fill={item.percent}
                  duration={1200}
                  delay={0}
                  easing={Easing.out(Easing.cubic)}
                  prefill={0}
                  rotation={-90}
                  arcSweepAngle={180}
                  lineCap="round"
                  tintColor={item.color}
                  backgroundColor={colors.chartTrack}
                  style={styles.breakdownGauge}
                >
                  {(fill: number) => (
                    <View style={styles.breakdownGaugeCenter}>
                      <Text style={[styles.breakdownGaugePercent, { color: item.color }]}>{Math.round(fill)}%</Text>
                      <Text style={styles.breakdownGaugeLabel}>{item.name}</Text>
                    </View>
                  )}
                </AnimatedCircularProgress>
              </View>
            )}
          />
        )}
      </View>

      {selectedExpense ? (
        <BottomSheetModal
          ref={expenseSheetRef}
          index={0}
          snapPoints={sheetSnapPoints}
          backdropComponent={renderSheetBackdrop}
          onDismiss={handleExpenseSheetDismiss}
          enablePanDownToClose
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          handleIndicatorStyle={styles.sheetHandleIndicator}
          handleStyle={styles.sheetHandle}
          backgroundStyle={styles.sheetBackground}
          detached={false}
          enableContentPanningGesture={false}
          enableOverDrag
          animateOnMount
        >
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            overScrollMode="always"
            bounces
            alwaysBounceVertical
            contentContainerStyle={[styles.sheetContent, { paddingBottom: 20 + sheetBottomInset }]}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTotalLabel}>Total Amount</Text>
                <Text style={styles.sheetTotalAmount}>{formatCents(selectedExpense.amountCents, selectedExpense.currency)}</Text>
                <Text style={styles.sheetTitle}>{selectedExpense.note || 'Expense'}</Text>
              </View>
              <Pressable onPress={closeExpenseSheet} accessibilityRole="button" accessibilityLabel="Close expense sheet" style={styles.closeButton}>
                <X color={colors.textMuted} size={20} strokeWidth={2.6} />
              </Pressable>
            </View>

            <View style={styles.sheetList}>
              {selectedExpense.items.map((item, index) => (
                <View key={`${selectedExpense.id}-${index}`} style={styles.sheetItem}>
                  <View style={styles.sheetItemRow}>
                    <Text style={styles.sheetItemLabel} numberOfLines={1}>{item.label}</Text>
                    <Text style={styles.sheetItemAmount}>{formatCents(item.amountCents, selectedExpense.currency)}</Text>
                  </View>
                </View>
              ))}
            </View>

            {sheetError ? <Text style={styles.sheetError}>{sheetError}</Text> : null}
          </BottomSheetScrollView>
        </BottomSheetModal>
      ) : null}

      <Modal visible={dayExpensesModalOpen} transparent animationType="fade" onRequestClose={closeDayExpensesModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDayExpensesModal} />
          <View style={[styles.modalCard, styles.dayExpensesModalCard]}>
            <PagerView
              ref={dayModalPagerRef}
              style={styles.dayModalPager}
              initialPage={0}
              overdrag
            >
              <View key="expenses-list" style={styles.dayModalPage}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>All expenses</Text>
                    <View style={styles.modalSubtitleActionRow}>
                      <Text style={[styles.modalSubtitle, styles.modalSubtitleInRow]}>{modalDateLabel} · {formatCents(modalExpenses.reduce((sum, expense) => sum + expense.amountCents, 0), displayCurrencyCode)}</Text>
                      <Pressable onPress={showDayAddPage} accessibilityRole="button" style={styles.modalAddButton}>
                        <Plus color={colors.onPrimary} size={15} strokeWidth={3} />
                        <Text style={styles.modalAddButtonText}>Add</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Pressable onPress={closeDayExpensesModal} accessibilityRole="button" style={styles.closeButton}>
                    <X color={colors.textMuted} size={20} strokeWidth={2.6} />
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.modalList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalListContent}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  overScrollMode="always"
                  bounces
                  alwaysBounceVertical
                >
                  {modalExpenses.length === 0 ? (
                    <EmptyState title="No expenses logged" message="Tap Add to create an expense without leaving this day." />
                  ) : (
                    modalExpenses.map((expense) => (
                      <ExpenseItem
                        key={expense.id}
                        expense={expense}
                        currencyCode={displayCurrencyCode}
                        categories={budgetCategories}
                        onPress={() => {
                          closeDayExpensesModal();
                          openExpenseSheet(expense);
                        }}
                      />
                    ))
                  )}
                </ScrollView>
              </View>

              <View key="add-expense" style={styles.dayModalPage}>
                <View style={styles.modalHeader}>
                  <Pressable onPress={showDayListPage} accessibilityRole="button" accessibilityLabel="Back to expense list" style={styles.backButton}>
                    <ChevronLeft color={colors.text} size={22} strokeWidth={2.7} />
                  </Pressable>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>Add expense</Text>
                    <View style={styles.modalSubtitleActionRow}>
                      <Text style={[styles.modalSubtitle, styles.modalSubtitleInRow]}>{modalDefaultSpentOn ? `For ${modalDateLabel}` : 'Create a new logged expense'}</Text>
                      <Pressable onPress={showDayListPage} accessibilityRole="button" style={styles.closeButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <ScrollView
                  style={styles.modalList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[styles.modalListContent, { paddingBottom: 86 + sheetBottomInset }]}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="none"
                  nestedScrollEnabled
                  overScrollMode="always"
                  bounces
                  alwaysBounceVertical
                >
                  <ExpenseForm
                    key={dayAddFormKey}
                    ref={dayAddFormRef}
                    submitLabel="Save Expense"
                    onSubmit={submitDayExpense}
                    currencyCode={displayCurrencyCode}
                    categories={budgetCategories}
                    defaultSpentOn={modalDefaultSpentOn}
                    showSubmitButton={false}
                    showInlineAddButton={false}
                  />
                </ScrollView>

                <View style={[styles.dayModalFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                  <Pressable onPress={() => dayAddFormRef.current?.addItem()} accessibilityRole="button" style={[styles.footerButton, styles.footerSecondary]}>
                    <Text style={styles.footerSecondaryText}>＋ Add Item</Text>
                  </Pressable>
                  <Pressable onPress={() => dayAddFormRef.current?.submit()} accessibilityRole="button" style={[styles.footerButton, styles.footerPrimary]}>
                    <Text style={styles.footerPrimaryText}>Save</Text>
                  </Pressable>
                </View>
              </View>
            </PagerView>
          </View>
        </View>
      </Modal>

      <Modal visible={categoryModalOpen} transparent animationType="fade" onRequestClose={() => setCategoryModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCategoryModalOpen(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>All categories</Text>
                <Text style={styles.modalSubtitle}>Amount and share of the selected period</Text>
              </View>
              <Pressable onPress={() => setCategoryModalOpen(false)} accessibilityRole="button" style={styles.closeButton}>
                <X color={colors.textMuted} size={20} strokeWidth={2.6} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalListContent}
              nestedScrollEnabled
              overScrollMode="always"
              bounces
              alwaysBounceVertical
            >
              {categorySummaries.map((item) => (
                <View key={item.id} style={styles.modalRow}>
                  <View style={styles.modalLeft}>
                    <AnimatedCircularProgress
                      size={58}
                      width={6}
                      fill={item.percent}
                      duration={1100}
                      delay={0}
                      easing={Easing.out(Easing.cubic)}
                      prefill={0}
                      rotation={-90}
                      arcSweepAngle={360}
                      lineCap="round"
                      tintColor={item.color}
                      backgroundColor={colors.chartTrack}
                      style={styles.modalGauge}
                    >
                      {(fill: number) => (
                        <View style={styles.modalGaugeCenter}>
                          <Text style={[styles.modalGaugePercent, { color: item.color }]}>{Math.round(fill)}%</Text>
                        </View>
                      )}
                    </AnimatedCircularProgress>
                    <View style={styles.breakdownTextBlock}>
                      <View style={styles.breakdownLabelRow}>
                        <CategoryIcon categoryId={item.id} emoji={item.emoji} size={22} />
                        <Text style={styles.breakdownLabel}>{item.name}</Text>
                      </View>
                      <Text style={styles.breakdownMeta}>{formatCents(item.amountCents, displayCurrencyCode)} spent · {formatCents(item.remainingCents, displayCurrencyCode)} left</Text>
                    </View>
                  </View>
                  <View style={styles.modalAmountBlock}>
                    <Text style={styles.modalAmount}>{formatCents(item.amountCents, displayCurrencyCode)}</Text>
                    <Text style={styles.modalPercent}>{item.percent}%</Text>
                  </View>
                </View>
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
  summaryStack: { gap: 10 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  section: { gap: 10 },
  daySection: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: spacing.card },
  breakdownSection: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  sectionTitleRow: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10 },
  sectionIconBubble: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.primarySoftBorder, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, height: 38, justifyContent: 'center', width: 38 },

  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  compactAddButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 999, flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingVertical: 7 },
  compactAddButtonText: { color: colors.onPrimary, fontSize: 12, fontWeight: '900' },
  sectionAction: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.primarySoft },
  sectionActionText: { color: colors.primaryPressed, fontWeight: '800' },
  link: { color: colors.primary, fontWeight: '800' },
  error: { color: colors.expense, fontWeight: '700' },
  breakdownRow: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  breakdownPercentCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownPercentText: { fontSize: 12, fontWeight: '900' },
  breakdownTextBlock: { flex: 1, gap: 2 },
  breakdownLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownLabel: { color: colors.text, fontWeight: '700' },
  breakdownMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  breakdownAmount: { color: colors.text, fontWeight: '800' },
  breakdownRail: { gap: 12, paddingRight: 4, paddingBottom: 8 },
  breakdownCard: {
    width: 170,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  breakdownGaugeCard: {
    justifyContent: 'center',
  },
  breakdownGauge: {
    alignSelf: 'center',
  },
  breakdownGaugeCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 2,
  },
  breakdownGaugePercent: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  breakdownGaugeLabel: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  breakdownCardTop: { gap: 10 },
  breakdownName: { color: colors.text, fontWeight: '800', fontSize: 14, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', paddingHorizontal: 16 },
  modalCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 18, gap: 14, maxHeight: '82%' },
  dayExpensesModalCard: { height: '82%', overflow: 'hidden', padding: 16, width: '100%' },
  dayModalPager: { flex: 1 },
  dayModalPage: { flex: 1, gap: 14 },
  dayModalFooter: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
  modalAddButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 999, flexDirection: 'row', gap: 4, paddingHorizontal: 11, paddingVertical: 7 },
  modalAddButtonText: { color: colors.onPrimary, fontSize: 12, fontWeight: '900' },
  backButton: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, height: 36, justifyContent: 'center', width: 36 },
  cancelText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  footerButton: { alignItems: 'center', borderRadius: 999, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  footerSecondary: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder, borderWidth: StyleSheet.hairlineWidth },
  footerPrimary: { backgroundColor: colors.primary },
  footerSecondaryText: { color: colors.primaryPressed, fontWeight: '900' },
  footerPrimaryText: { color: colors.onPrimary, fontWeight: '900' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modalHeaderText: { flex: 1, gap: 2 },
  modalSubtitleActionRow: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginTop: 4 },
  modalSubtitleInRow: { flex: 1 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  modalSubtitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  modalList: { gap: 10, marginHorizontal: -8 },
  modalListContent: { gap: 10, paddingHorizontal: 8, paddingBottom: 10 },
  modalRow: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  modalLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  modalGauge: { alignSelf: 'center' },
  modalGaugeCenter: { alignItems: 'center', justifyContent: 'center' },
  modalGaugePercent: { fontSize: 14, fontWeight: '900', lineHeight: 16 },
  modalAmountBlock: { alignItems: 'flex-end', gap: 2 },
  modalAmount: { color: colors.text, fontWeight: '900' },
  modalPercent: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  sheetBackground: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetHandle: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  sheetHandleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.divider,
  },
  sheetContent: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sheetHeaderText: { flex: 1 },
  sheetTotalLabel: { color: colors.textMuted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  sheetTotalAmount: { color: colors.text, fontSize: 26, fontWeight: '900', marginTop: 2 },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 6 },
  closeButton: { paddingHorizontal: 8, paddingVertical: 2 },
  closeText: { color: colors.textMuted, fontSize: 20, fontWeight: '900' },
  sheetList: { gap: 10 },
  sheetItem: { backgroundColor: colors.background, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 14 },
  sheetItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sheetItemLabel: { color: colors.text, fontWeight: '700', flex: 1 },
  sheetItemAmount: { color: colors.text, fontWeight: '800' },
  sheetError: { color: colors.expense, fontWeight: '700' },
  });
}
