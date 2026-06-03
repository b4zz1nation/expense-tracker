import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text } from 'react-native';
import { ExpenseForm } from '../../src/components/ExpenseForm';
import { Screen } from '../../src/components/Screen';
import { deleteExpense, getExpense, updateExpense } from '../../src/db/expensesRepo';
import type { Expense, ExpenseFormValues } from '../../src/types/expense';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const found = await getExpense(id);
        setExpense(found);
        setError(found ? null : 'Expense not found.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load expense.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  const submit = async (values: ExpenseFormValues) => {
    if (!id) return;
    await updateExpense(id, values);
    Alert.alert('Expense updated', 'Your changes were saved.');
    router.back();
  };

  const remove = async () => {
    if (!id) return;
    await deleteExpense(id);
    Alert.alert('Expense deleted', 'The expense was removed.');
    router.back();
  };

  if (loading) {
    return <Screen><ActivityIndicator /></Screen>;
  }

  if (error || !expense) {
    return <Screen><Text>{error ?? 'Expense not found.'}</Text></Screen>;
  }

  return (
    <Screen>
      <ExpenseForm initialExpense={expense} submitLabel="Save Changes" onSubmit={submit} onDelete={remove} />
    </Screen>
  );
}
