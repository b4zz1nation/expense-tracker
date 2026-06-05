import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ExpenseForm } from '../../src/components/ExpenseForm';
import { Screen } from '../../src/components/Screen';
import { createExpenses } from '../../src/db/expensesRepo';
import { getPreferredCurrencyCode } from '../../src/db/settingsRepo';
import { useAppTheme } from '../../src/theme/ThemeContext';
import type { ExpenseFormValues } from '../../src/types/expense';

export default function NewExpenseScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [currencyCode, setCurrencyCode] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setCurrencyCode(await getPreferredCurrencyCode());
    })();
  }, []);

  const submit = async (values: ExpenseFormValues) => {
    const expenses = await createExpenses(values, currencyCode ?? undefined);
    Alert.alert('Expenses added', `${expenses.length} item${expenses.length === 1 ? '' : 's'} saved.`);
    router.back();
  };

  return (
    <Screen>
      {currencyCode ? (
        <ExpenseForm submitLabel="Save Expense" onSubmit={submit} currencyCode={currencyCode} />
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
