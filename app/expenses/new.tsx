import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ExpenseForm } from '../../src/components/ExpenseForm';
import { Screen } from '../../src/components/Screen';
import { createExpenses } from '../../src/db/expensesRepo';
import { getPreferredCurrencyCode } from '../../src/db/settingsRepo';
import type { ExpenseFormValues } from '../../src/types/expense';

export default function NewExpenseScreen() {
  const router = useRouter();
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
      {!currencyCode ? <Text style={{ marginTop: 12, color: '#64748B' }}>Loading your default currency…</Text> : null}
    </Screen>
  );
}
