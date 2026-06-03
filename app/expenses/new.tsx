import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { ExpenseForm } from '../../src/components/ExpenseForm';
import { Screen } from '../../src/components/Screen';
import { createExpenses } from '../../src/db/expensesRepo';
import type { ExpenseFormValues } from '../../src/types/expense';

export default function NewExpenseScreen() {
  const router = useRouter();

  const submit = async (values: ExpenseFormValues) => {
    const expenses = await createExpenses(values);
    Alert.alert('Expenses added', `${expenses.length} item${expenses.length === 1 ? '' : 's'} saved.`);
    router.back();
  };

  return (
    <Screen>
      <ExpenseForm submitLabel="Save Expense" onSubmit={submit} />
    </Screen>
  );
}
