import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text } from 'react-native';
import { ExpenseForm, type ExpenseFormHandle } from '../../src/components/ExpenseForm';
import { Screen } from '../../src/components/Screen';
import { deleteExpense, getExpense, updateExpense } from '../../src/db/expensesRepo';
import type { Expense, ExpenseFormValues } from '../../src/types/expense';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const formRef = useRef<ExpenseFormHandle>(null);
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
    if (!id || !expense) return;
    await updateExpense(id, values, expense.currency);
    Alert.alert('Expense updated', 'Your changes were saved.');
    router.back();
  };

  const remove = async () => {
    if (!id) return;
    await deleteExpense(id);
    Alert.alert('Expense deleted', 'The expense was removed.');
    router.back();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => formRef.current?.submit()}
          accessibilityRole="button"
          accessibilityLabel="Save changes"
          style={({ pressed }) => [
            {
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: '#DBEAFE',
            },
            pressed ? { opacity: 0.8 } : null,
          ]}
        >
          <Text style={{ color: '#1D4ED8', fontWeight: '800' }}>Save</Text>
        </Pressable>
      ),
    });
  }, [router]);
  if (loading) {
    return <Screen><ActivityIndicator /></Screen>;
  }

  if (error || !expense) {
    return <Screen><Text>{error ?? 'Expense not found.'}</Text></Screen>;
  }

  return (
    <Screen>
      <ExpenseForm ref={formRef} initialExpense={expense} submitLabel="Save Changes" onSubmit={submit} onDelete={remove} showSubmitButton={false} metaFieldsLayout="row" currencyCode={expense.currency} />
    </Screen>
  );
}
