import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text } from 'react-native';
import { ExpenseForm } from '../../src/components/ExpenseForm';
import { Screen } from '../../src/components/Screen';
import { createExpenses } from '../../src/db/expensesRepo';
import { getPreferredCurrencyCode, getUserProfile } from '../../src/db/settingsRepo';
import { useAppTheme } from '../../src/theme/ThemeContext';
import type { BudgetCategory } from '../../src/types/categoryBudget';
import type { ExpenseFormValues } from '../../src/types/expense';

export default function NewExpenseScreen() {
  const router = useRouter();
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
    <Screen keyboardAware>
      {currencyCode ? (
        <ExpenseForm
          submitLabel="Save Expense"
          onSubmit={submit}
          currencyCode={currencyCode}
          categories={categories}
          defaultCategoryId={categoryId}
          lockedCategoryId={locked === '1' ? categoryId : undefined}
        />
      ) : (
        <ActivityIndicator />
      )}
      {!currencyCode ? <Text style={styles.loadingText}>Loading your default currency…</Text> : null}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    loadingText: { marginTop: 12, color: theme.colors.textMuted },
  });
}
