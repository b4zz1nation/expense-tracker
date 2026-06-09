import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';
import { ExpenseForm, type ExpenseFormHandle } from '../../src/components/ExpenseForm';
import { Screen } from '../../src/components/Screen';
import { deleteExpense, getExpense, updateExpense } from '../../src/db/expensesRepo';
import { getUserProfile } from '../../src/db/settingsRepo';
import { useAppTheme } from '../../src/theme/ThemeContext';
import type { BudgetCategory } from '../../src/types/categoryBudget';
import type { Expense, ExpenseFormValues } from '../../src/types/expense';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const formRef = useRef<ExpenseFormHandle>(null);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const [found, profile] = await Promise.all([getExpense(id), getUserProfile()]);
        setExpense(found);
        setCategories(profile?.categoryBudgets ?? []);
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
          style={({ pressed }) => [styles.headerSaveButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.headerSaveText}>Save</Text>
        </Pressable>
      ),
    });
  }, [navigation, styles]);

  if (loading) {
    return <Screen keyboardAware><ActivityIndicator /></Screen>;
  }

  if (error || !expense) {
    return <Screen keyboardAware><Text style={styles.errorText}>{error ?? 'Expense not found.'}</Text></Screen>;
  }

  return (
    <Screen keyboardAware>
      <ExpenseForm ref={formRef} initialExpense={expense} submitLabel="Save Changes" onSubmit={submit} onDelete={remove} showSubmitButton={false} metaFieldsLayout="row" currencyCode={expense.currency} categories={categories} />
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors } = theme;
  return StyleSheet.create({
    headerSaveButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.primarySoft,
    },
    headerSaveText: { color: colors.primary, fontWeight: '800' },
    errorText: { color: colors.expense, fontWeight: '700' },
    pressed: { opacity: 0.8 },
  });
}
