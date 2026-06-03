import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../../src/components/AppButton';
import { EmptyState } from '../../src/components/EmptyState';
import { ExpenseItem } from '../../src/components/ExpenseItem';
import { Screen } from '../../src/components/Screen';
import { StatCard } from '../../src/components/StatCard';
import { useExpenseSheet } from '../../src/context/ExpenseSheetContext';
import { CATEGORIES } from '../../src/constants/categories';
import { formatCents } from '../../src/lib/currency';
import { getPreferredCurrencyCode } from '../../src/db/settingsRepo';
import { currentMonthString, monthLabel, shiftMonth } from '../../src/lib/dates';
import { useExpenses } from '../../src/hooks/useExpenses';
import type { Expense } from '../../src/types/expense';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSheetOpen } = useExpenseSheet();
  const [month, setMonth] = useState(currentMonthString());
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [displayCurrencyCode, setDisplayCurrencyCode] = useState('USD');
  const { recentExpenses, monthlyTotal, categoryBreakdown, loading, error, refresh } = useExpenses(month);
  const expenseSheetRef = useRef<BottomSheetModal>(null);
  const sheetSnapPoints = useMemo(() => ['68%', '96%'], []);
  const sheetBottomInset = Math.max(insets.bottom, 12);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
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

  const categorySummaries = useMemo(() => {
    const breakdownById = new Map(categoryBreakdown.map((item) => [item.categoryId, item]));
    return CATEGORIES.map((category) => {
      const breakdown = breakdownById.get(category.id);
      const amountCents = breakdown?.amountCents ?? 0;
      const percent = monthlyTotal > 0 ? Math.round((amountCents / monthlyTotal) * 100) : 0;
      return {
        ...category,
        amountCents,
        percent,
        count: breakdown?.count ?? 0,
      };
    }).sort((a, b) => b.amountCents - a.amountCents);
  }, [categoryBreakdown, monthlyTotal]);

  const visibleCategorySummaries = categorySummaries.filter((item) => item.amountCents > 0);

  return (
    <Screen>
      <View style={styles.monthRow}>
        <Text style={styles.monthArrow} onPress={() => setMonth((current) => shiftMonth(current, -1))}>‹</Text>
        <Text style={styles.month}>{monthLabel(month)}</Text>
        <Text style={styles.monthArrow} onPress={() => setMonth((current) => shiftMonth(current, 1))}>›</Text>
      </View>

      <StatCard label="Total spent this month" value={formatCents(monthlyTotal, displayCurrencyCode)} helper="Local-first, stored on this device" />
      <AppButton onPress={() => router.push('/expenses/new')}>Add Expense</AppButton>

      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={[styles.section, styles.breakdownSection]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category breakdown</Text>
          <Pressable onPress={() => setCategoryModalOpen(true)} accessibilityRole="button" style={styles.sectionAction}>
            <Text style={styles.sectionActionText}>Expand</Text>
          </Pressable>
        </View>
        {visibleCategorySummaries.length === 0 ? (
          <EmptyState title="No spending yet this month" message="Add your first expense to see a category breakdown." />
        ) : (
          <FlatList
            data={visibleCategorySummaries}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.breakdownRail}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.breakdownCard,
                  styles.breakdownGaugeCard,
                  {
                    shadowColor: '#0F172A',
                  },
                ]}
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
                  backgroundColor="#E2E8F0"
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

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent expenses</Text>
          <Text style={styles.link} onPress={() => router.push('/expenses')}>View all</Text>
        </View>
        {recentExpenses.length === 0 ? (
          <EmptyState title="No expenses yet" message="Add your first expense to start tracking." actionLabel="Add Expense" onAction={() => router.push('/expenses/new')} />
        ) : (
          recentExpenses.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} currencyCode={displayCurrencyCode} onPress={() => openExpenseSheet(expense)} />
          ))
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
          enableContentPanningGesture
          enableOverDrag
          animateOnMount
        >
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.sheetContent, { paddingBottom: 20 + sheetBottomInset }]}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTotalLabel}>Total Amount</Text>
                <Text style={styles.sheetTotalAmount}>{formatCents(selectedExpense.amountCents, selectedExpense.currency)}</Text>
                <Text style={styles.sheetTitle}>{selectedExpense.note || 'Expense'}</Text>
              </View>
              <Pressable onPress={closeExpenseSheet} accessibilityRole="button" accessibilityLabel="Close expense sheet" style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
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

      <Modal visible={categoryModalOpen} transparent animationType="fade" onRequestClose={() => setCategoryModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>All categories</Text>
                <Text style={styles.modalSubtitle}>Amount and share of the selected month</Text>
              </View>
              <Pressable onPress={() => setCategoryModalOpen(false)} accessibilityRole="button" style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalListContent}>
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
                      backgroundColor="#E2E8F0"
                      style={styles.modalGauge}
                    >
                      {(fill: number) => (
                        <View style={styles.modalGaugeCenter}>
                          <Text style={[styles.modalGaugePercent, { color: item.color }]}>{Math.round(fill)}%</Text>
                        </View>
                      )}
                    </AnimatedCircularProgress>
                    <View style={styles.breakdownTextBlock}>
                      <Text style={styles.breakdownLabel}>{item.emoji} {item.name}</Text>
                      <Text style={styles.breakdownMeta}>{item.count} expense{item.count === 1 ? '' : 's'}</Text>
                    </View>
                  </View>
                  <View style={styles.modalAmountBlock}>
                    <Text style={styles.modalAmount}>{formatCents(item.amountCents, displayCurrencyCode)}</Text>
                    <Text style={styles.modalPercent}>{item.percent}%</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

    </Screen>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  month: { color: '#0F172A', fontWeight: '800', fontSize: 18 },
  monthArrow: { color: '#2563EB', fontSize: 34, fontWeight: '700', paddingHorizontal: 16 },
  section: { gap: 10 },
  breakdownSection: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  sectionAction: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#E0E7FF' },
  sectionActionText: { color: '#1D4ED8', fontWeight: '800' },
  link: { color: '#2563EB', fontWeight: '800' },
  error: { color: '#DC2626', fontWeight: '700' },
  breakdownRow: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  breakdownPercentCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  breakdownPercentText: { fontSize: 12, fontWeight: '900' },
  breakdownTextBlock: { flex: 1, gap: 2 },
  breakdownLabel: { color: '#0F172A', fontWeight: '700' },
  breakdownMeta: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  breakdownAmount: { color: '#0F172A', fontWeight: '800' },
  breakdownRail: { gap: 12, paddingRight: 4, paddingBottom: 8 },
  breakdownCard: {
    width: 170,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
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
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  breakdownCardTop: { gap: 10 },
  breakdownName: { color: '#0F172A', fontWeight: '800', fontSize: 14, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.48)', justifyContent: 'center', paddingHorizontal: 16 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, gap: 14, maxHeight: '82%' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modalHeaderText: { flex: 1, gap: 2 },
  modalTitle: { color: '#0F172A', fontSize: 20, fontWeight: '900' },
  modalSubtitle: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  modalList: { gap: 10 },
  modalListContent: { gap: 10, paddingBottom: 2 },
  modalRow: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  modalLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  modalGauge: { alignSelf: 'center' },
  modalGaugeCenter: { alignItems: 'center', justifyContent: 'center' },
  modalGaugePercent: { fontSize: 14, fontWeight: '900', lineHeight: 16 },
  modalAmountBlock: { alignItems: 'flex-end', gap: 2 },
  modalAmount: { color: '#0F172A', fontWeight: '900' },
  modalPercent: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  sheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
  },
  sheetHandle: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  sheetHandleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
  },
  sheetContent: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sheetHeaderText: { flex: 1 },
  sheetTotalLabel: { color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  sheetTotalAmount: { color: '#0F172A', fontSize: 26, fontWeight: '900', marginTop: 2 },
  sheetTitle: { color: '#0F172A', fontSize: 18, fontWeight: '900', marginTop: 6 },
  closeButton: { paddingHorizontal: 8, paddingVertical: 2 },
  closeText: { color: '#64748B', fontSize: 20, fontWeight: '900' },
  sheetList: { gap: 10 },
  sheetItem: { backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 14 },
  sheetItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sheetItemLabel: { color: '#0F172A', fontWeight: '700', flex: 1 },
  sheetItemAmount: { color: '#0F172A', fontWeight: '800' },
  sheetError: { color: '#DC2626', fontWeight: '700' },
});
