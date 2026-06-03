import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CATEGORIES, getCategory, type CategoryId } from '../constants/categories';
import { formatCents } from '../lib/currency';
import { todayDateString } from '../lib/dates';
import { expenseSchema } from '../schemas/expenseSchema';
import type { Expense, ExpenseFormItem, ExpenseFormValues } from '../types/expense';
import { AppButton } from './AppButton';

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

function createFormItem(label = '', amount = ''): ExpenseFormItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label,
    amount,
  };
}

const ITEM_LABELS: Record<CategoryId, { heading: string; add: string; placeholder: string }> = {
  food: { heading: 'Food items', add: 'Add food item', placeholder: 'Burger, fries, coffee...' },
  transport: { heading: 'Trips', add: 'Add trip', placeholder: 'Bus, taxi, gas...' },
  shopping: { heading: 'Shopping items', add: 'Add shopping item', placeholder: 'Shirt, charger, soap...' },
  bills: { heading: 'Bill items', add: 'Add bill', placeholder: 'Internet, rent, phone...' },
  entertainment: { heading: 'Entertainment items', add: 'Add entertainment item', placeholder: 'Movie, game, concert...' },
  health: { heading: 'Health items', add: 'Add health item', placeholder: 'Medicine, checkup...' },
  travel: { heading: 'Travel items', add: 'Add travel item', placeholder: 'Hotel, ticket, meal...' },
  other: { heading: 'Items', add: 'Add item', placeholder: 'What did you buy?' },
};

type Props = {
  initialExpense?: Expense | null;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  submitLabel: string;
  allowMultipleItems?: boolean;
};

export function ExpenseForm({ initialExpense, onSubmit, onDelete, submitLabel, allowMultipleItems = !initialExpense }: Props) {
  const initialValues = useMemo<ExpenseFormValues>(() => ({
    categoryId: initialExpense?.categoryId ?? 'food',
    spentOn: initialExpense?.spentOn ?? todayDateString(),
    items: [createFormItem(initialExpense?.note ?? '', initialExpense ? centsToInput(initialExpense.amountCents) : '')],
  }), [initialExpense]);

  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedCategory = getCategory(values.categoryId);
  const labels = ITEM_LABELS[values.categoryId];
  const itemTotalCents = values.items.reduce((total, item) => {
    const amount = Number.parseFloat(item.amount);
    return Number.isFinite(amount) && amount > 0 ? total + Math.round(amount * 100) : total;
  }, 0);

  const updateItem = (id: string | undefined, changes: Partial<ExpenseFormItem>) => {
    setValues((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    }));
  };

  const addItem = () => {
    setValues((current) => ({ ...current, items: [...current.items, createFormItem()] }));
  };

  const removeItem = (id: string | undefined) => {
    setValues((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
  };

  const submit = async () => {
    const parsed = expenseSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form and try again.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit(parsed.data as ExpenseFormValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save expense.');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async () => {
    if (!onDelete) return;
    Alert.alert('Delete expense?', 'This will remove the expense from normal views.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true);
            try {
              await onDelete();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not delete expense.');
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((category) => {
            const selected = values.categoryId === category.id;
            return (
              <Text
                key={category.id}
                onPress={() => setValues((current) => ({ ...current, categoryId: category.id as CategoryId }))}
                style={[styles.categoryChip, selected && { backgroundColor: category.color, color: '#FFFFFF' }]}
              >
                {category.emoji} {category.name}
              </Text>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          placeholder="YYYY-MM-DD"
          value={values.spentOn}
          onChangeText={(spentOn) => setValues((current) => ({ ...current, spentOn }))}
          style={styles.input}
        />
      </View>

      <View style={[styles.summaryCard, { borderColor: selectedCategory.color }]}>
        <Text style={styles.summaryLabel}>{selectedCategory.emoji} {labels.heading}</Text>
        <Text style={styles.summaryTotal}>{formatCents(itemTotalCents)}</Text>
        <Text style={styles.summaryHint}>Add each thing you bought so the list shows exactly where your money went.</Text>
      </View>

      <View style={styles.field}>
        <View style={styles.sectionHeader}>
          <Text style={styles.label}>{labels.heading}</Text>
          {allowMultipleItems ? <Text style={styles.itemCount}>{values.items.length}/25</Text> : null}
        </View>

        {values.items.map((item, index) => (
          <View key={item.id ?? index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{selectedCategory.name} #{index + 1}</Text>
              {allowMultipleItems && values.items.length > 1 ? (
                <Pressable onPress={() => removeItem(item.id)} accessibilityRole="button">
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
            <TextInput
              autoFocus={!initialExpense && index === 0}
              placeholder={labels.placeholder}
              value={item.label}
              onChangeText={(label) => updateItem(item.id, { label })}
              style={styles.input}
              maxLength={120}
            />
            <TextInput
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={item.amount}
              onChangeText={(amount) => updateItem(item.id, { amount })}
              style={styles.amountInput}
            />
          </View>
        ))}

        {allowMultipleItems ? (
          <AppButton onPress={addItem} variant="secondary" disabled={values.items.length >= 25}>＋ {labels.add}</AppButton>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton onPress={submit} disabled={saving}>{saving ? 'Saving...' : submitLabel}</AppButton>
      {onDelete ? <AppButton onPress={deleteExpense} variant="danger" disabled={saving}>Delete Expense</AppButton> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 18 },
  field: { gap: 8 },
  label: { color: '#0F172A', fontWeight: '800', fontSize: 15 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0' },
  amountInput: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', fontWeight: '800', fontSize: 18 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { backgroundColor: '#E2E8F0', color: '#0F172A', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, overflow: 'hidden', fontWeight: '700' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 6, borderWidth: 1 },
  summaryLabel: { color: '#64748B', fontWeight: '800' },
  summaryTotal: { color: '#0F172A', fontWeight: '900', fontSize: 34 },
  summaryHint: { color: '#64748B', lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCount: { color: '#64748B', fontWeight: '700' },
  itemCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, gap: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { color: '#0F172A', fontWeight: '800' },
  remove: { color: '#DC2626', fontWeight: '800' },
  error: { color: '#DC2626', fontWeight: '700' },
});
