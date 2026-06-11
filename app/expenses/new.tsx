import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpenseForm, type ExpenseFormHandle } from '../../src/components/ExpenseForm';
import { createExpenses } from '../../src/db/expensesRepo';
import { getPreferredCurrencyCode, getUserProfile } from '../../src/db/settingsRepo';
import { useAppTheme } from '../../src/theme/ThemeContext';
import type { BudgetCategory } from '../../src/types/categoryBudget';
import type { ExpenseFormValues } from '../../src/types/expense';

export default function NewExpenseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const formRef = useRef<ExpenseFormHandle>(null);
  const { categoryId, locked } = useLocalSearchParams<{ categoryId?: string; locked?: string }>();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [currencyCode, setCurrencyCode] = useState<string | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);

  useEffect(() => {
    void (async () => {
      const [nextCurrency, profile] = await Promise.all([getPreferredCurrencyCode(), getUserProfile()]);
      setCurrencyCode(nextCurrency);
      setCategories(profile?.categoryBudgets ?? []);
    })();
  }, []);

  const submit = async (values: ExpenseFormValues) => {
    const expenses = await createExpenses(values, currencyCode ?? undefined);
    Alert.alert('Expenses added', `${expenses.length} item${expenses.length === 1 ? '' : 's'} saved.`);
    router.back();
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 104 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        nestedScrollEnabled
        overScrollMode="always"
        bounces
        alwaysBounceVertical
      >
        {currencyCode ? (
          <ExpenseForm
            ref={formRef}
            submitLabel="Save Expense"
            onSubmit={submit}
            currencyCode={currencyCode}
            categories={categories}
            defaultCategoryId={categoryId}
            lockedCategoryId={locked === '1' ? categoryId : undefined}
            showSubmitButton={false}
            showInlineAddButton={false}
          />
        ) : (
          <ActivityIndicator />
        )}
        {!currencyCode ? <Text style={styles.loadingText}>Loading your default currency…</Text> : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable onPress={() => formRef.current?.addItem()} accessibilityRole="button" style={({ pressed }) => [styles.footerButton, styles.footerSecondary, pressed && styles.pressed]}>
          <Text style={styles.footerSecondaryText}>＋ Add Item</Text>
        </Pressable>
        <Pressable onPress={() => formRef.current?.submit()} accessibilityRole="button" style={({ pressed }) => [styles.footerButton, styles.footerPrimary, pressed && styles.pressed]}>
          <Text style={styles.footerPrimaryText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, gap: spacing.lg, padding: spacing.screen, backgroundColor: colors.background },
    loadingText: { marginTop: 12, color: colors.textMuted },
    footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: spacing.screen, paddingTop: 12, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
    footerButton: { alignItems: 'center', borderRadius: 999, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
    footerSecondary: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder, borderWidth: StyleSheet.hairlineWidth },
    footerPrimary: { backgroundColor: colors.primary },
    footerSecondaryText: { color: colors.primaryPressed, fontWeight: '900' },
    footerPrimaryText: { color: colors.onPrimary, fontWeight: '900' },
    pressed: { opacity: 0.82 },
  });
}
