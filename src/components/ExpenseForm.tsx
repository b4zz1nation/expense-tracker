import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CATEGORIES, getCategory, type CategoryId } from '../constants/categories';
import { formatCents } from '../lib/currency';
import { todayDateString } from '../lib/dates';
import { expenseSchema } from '../schemas/expenseSchema';
import type { Expense, ExpenseFormItem, ExpenseFormValues } from '../types/expense';
import { AppButton } from './AppButton';

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

function extractGroupNote(note?: string | null): string {
  if (!note) return '';
  const separator = ' · ';
  const separatorIndex = note.indexOf(separator);
  return separatorIndex >= 0 ? note.slice(0, separatorIndex) : '';
}

function createFormItem(label = '', amount = ''): ExpenseFormItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label,
    amount,
  };
}

const ITEM_LABELS: Record<CategoryId, { heading: string; add: string; edit: string; singular: string; placeholder: string }> = {
  food: { heading: 'Food items', add: 'Add food item', edit: 'Edit food item', singular: 'food item', placeholder: 'Burger, fries, coffee...' },
  transport: { heading: 'Trips', add: 'Add trip', edit: 'Edit trip', singular: 'trip', placeholder: 'Bus, taxi, gas...' },
  shopping: { heading: 'Shopping items', add: 'Add shopping item', edit: 'Edit shopping item', singular: 'shopping item', placeholder: 'Shirt, charger, soap...' },
  bills: { heading: 'Bill items', add: 'Add bill item', edit: 'Edit bill item', singular: 'bill item', placeholder: 'Internet, rent, phone...' },
  entertainment: { heading: 'Entertainment items', add: 'Add entertainment item', edit: 'Edit entertainment item', singular: 'entertainment item', placeholder: 'Movie, game, concert...' },
  health: { heading: 'Health items', add: 'Add health item', edit: 'Edit health item', singular: 'health item', placeholder: 'Medicine, checkup...' },
  travel: { heading: 'Travel items', add: 'Add travel item', edit: 'Edit travel item', singular: 'travel item', placeholder: 'Hotel, ticket, meal...' },
  other: { heading: 'Items', add: 'Add item', edit: 'Edit item', singular: 'item', placeholder: 'What did you buy?' },
};

type Props = {
  initialExpense?: Expense | null;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  submitLabel: string;
  showSubmitButton?: boolean;
  metaFieldsLayout?: 'row' | 'column';
  currencyCode?: string;
};

export type ExpenseFormHandle = {
  submit: () => void;
};

export const ExpenseForm = forwardRef<ExpenseFormHandle, Props>(function ExpenseForm(
  { initialExpense, onSubmit, onDelete, submitLabel, showSubmitButton = true, metaFieldsLayout = 'column', currencyCode },
  ref
) {

  const initialValues = useMemo<ExpenseFormValues>(() => {
    if (!initialExpense) {
      return {
        categoryId: 'food',
        spentOn: todayDateString(),
        groupNote: '',
        items: [],
      };
    }

    const items = initialExpense.items.length > 0
      ? initialExpense.items.map((item, index) => ({
          id: `${initialExpense.id}-${index}`,
          label: item.label,
          amount: centsToInput(item.amountCents),
        }))
      : [createFormItem(initialExpense.note, centsToInput(initialExpense.amountCents))];

    return {
      categoryId: initialExpense.categoryId,
      spentOn: initialExpense.spentOn,
      groupNote: initialExpense.items.length > 1 ? initialExpense.note : extractGroupNote(initialExpense.note),
      items,
    };
  }, [initialExpense]);

  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemDraftIndex, setItemDraftIndex] = useState<number | null>(null);
  const [itemDraftLabel, setItemDraftLabel] = useState('');
  const [itemDraftAmount, setItemDraftAmount] = useState('');
  const [itemDraftError, setItemDraftError] = useState<string | null>(null);

  const selectedCategory = getCategory(values.categoryId);
  const labels = ITEM_LABELS[values.categoryId];
  const displayCurrencyCode = currencyCode ?? initialExpense?.currency ?? 'USD';
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

  const openItemModal = (index: number | null = null) => {
    const item = index === null ? null : values.items[index];
    setItemDraftIndex(index);
    setItemDraftLabel(item?.label ?? '');
    setItemDraftAmount(item?.amount ?? '');
    setItemDraftError(null);
    setItemModalOpen(true);
  };

  const closeItemModal = () => {
    setItemModalOpen(false);
    setItemDraftIndex(null);
    setItemDraftError(null);
  };

  const saveItemDraft = () => {
    const label = itemDraftLabel.trim();
    const amount = itemDraftAmount.trim();
    const amountValue = Number.parseFloat(amount);

    if (!label || !Number.isFinite(amountValue) || amountValue <= 0) {
      setItemDraftError('Enter an item name and a valid price.');
      return;
    }

    setValues((current) => {
      if (itemDraftIndex === null) {
        return { ...current, items: [...current.items, createFormItem(label, amount)] };
      }

      return {
        ...current,
        items: current.items.map((item, index) => (index === itemDraftIndex ? { ...item, label, amount } : item)),
      };
    });
    closeItemModal();
  };

  const removeItemDraft = () => {
    if (itemDraftIndex === null) return;

    setValues((current) => ({
      ...current,
      items: current.items.filter((_, index) => index !== itemDraftIndex),
    }));
    closeItemModal();
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

  useImperativeHandle(ref, () => ({
    submit: () => {
      void submit();
    },
  }), [submit]);

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
      <View style={[styles.summaryCard, { borderColor: selectedCategory.color }]}>
        <Text style={styles.summaryLabel}>{selectedCategory.emoji} {labels.heading}</Text>
        <Text style={styles.summaryTotal}>{formatCents(itemTotalCents, displayCurrencyCode)}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Category</Text>
        <Pressable
          onPress={() => setCategoryMenuOpen(true)}
          style={({ pressed }) => [styles.dropdown, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Choose category"
        >
          <Text style={styles.dropdownText}>{selectedCategory.emoji} {selectedCategory.name}</Text>
          <View style={styles.dropdownIconWrap}>
            <MaterialCommunityIcons name="menu-down" size={22} color="#334155" />
          </View>
        </Pressable>
      </View>

      <View style={[styles.metaFields, metaFieldsLayout === 'row' && styles.metaFieldsRow]}>
        <View style={[styles.field, styles.metaField, metaFieldsLayout === 'row' && styles.metaFieldRow]}>
          <Text style={styles.label}>Group note</Text>
          <TextInput
            placeholder="Type something like food#1 or team lunch"
            value={values.groupNote}
            onChangeText={(groupNote) => setValues((current) => ({ ...current, groupNote }))}
            style={styles.input}
            maxLength={80}
          />
        </View>

        <View style={[styles.field, styles.metaField, metaFieldsLayout === 'row' && styles.metaFieldRow]}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            placeholder="YYYY-MM-DD"
            value={values.spentOn}
            onChangeText={(spentOn) => setValues((current) => ({ ...current, spentOn }))}
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.field}>
        <View style={styles.sectionHeader}>
          <Text style={styles.label}>{labels.heading}</Text>
          <Text style={styles.itemCount}>{values.items.length}/25</Text>
        </View>

        <FlashList
          data={values.items}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => openItemModal(index)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${labels.singular} ${index + 1}`}
              style={({ pressed }) => [styles.foodItemCard, pressed && styles.pressed]}
            >
              <View style={styles.foodItemContent}>
                <View style={styles.foodItemTopRow}>
                  <View style={styles.foodItemLabelWrap}>
                    <Text style={styles.foodItemEmoji}>{selectedCategory.emoji}</Text>
                    <Text style={styles.foodItemLabel} numberOfLines={1}>
                      {item.label || labels.placeholder}
                    </Text>
                  </View>
                  <Text style={styles.foodItemAmount}>{item.amount ? formatCents(Math.round(Number.parseFloat(item.amount) * 100), displayCurrencyCode) : formatCents(0, displayCurrencyCode)}</Text>
                </View>
              </View>
            </Pressable>
          )}
          keyExtractor={(item, index) => item.id ?? String(index)}
          scrollEnabled={false}
          contentContainerStyle={styles.foodList}
          ListEmptyComponent={<Text style={styles.helper}>Add your first {labels.singular}.</Text>}
        />

        <AppButton onPress={() => openItemModal()} variant="secondary" disabled={values.items.length >= 25}>＋ {labels.add}</AppButton>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {showSubmitButton ? <AppButton onPress={submit} disabled={saving}>{saving ? 'Saving...' : submitLabel}</AppButton> : null}
      {onDelete ? <AppButton onPress={deleteExpense} variant="danger" disabled={saving}>Delete Expense</AppButton> : null}

      <Modal
        visible={categoryMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryMenuOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryMenuOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select category</Text>
            <View style={styles.modalList}>
              {CATEGORIES.map((category) => {
                const selected = values.categoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      setValues((current) => ({ ...current, categoryId: category.id as CategoryId }));
                      setCategoryMenuOpen(false);
                    }}
                    style={[styles.modalItem, selected && { backgroundColor: `${category.color}18` }]}
                  >
                    <Text style={[styles.modalItemText, selected && { color: category.color }]}>
                      {category.emoji} {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={itemModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeItemModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeItemModal}>
          <View style={styles.foodModalCard}>
            <Text style={styles.modalTitle}>{itemDraftIndex === null ? labels.add : labels.edit}</Text>
            <TextInput
              placeholder={labels.placeholder}
              value={itemDraftLabel}
              onChangeText={setItemDraftLabel}
              style={styles.input}
              maxLength={120}
              autoFocus
            />
            <TextInput
              placeholder="Price"
              value={itemDraftAmount}
              onChangeText={setItemDraftAmount}
              style={styles.amountInput}
              keyboardType="decimal-pad"
            />
            {itemDraftError ? <Text style={styles.error}>{itemDraftError}</Text> : null}
            <View style={styles.modalActions}>
              {itemDraftIndex !== null ? (
                <Pressable onPress={removeItemDraft} style={({ pressed }) => [styles.modalActionDanger, pressed && styles.pressed]}>
                  <Text style={styles.modalActionDangerText}>Remove</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={closeItemModal} style={({ pressed }) => [styles.modalActionSecondary, pressed && styles.pressed]}>
                <Text style={styles.modalActionSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveItemDraft} style={({ pressed }) => [styles.modalActionPrimary, pressed && styles.pressed]}>
                <Text style={styles.modalActionPrimaryText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  form: { gap: 18 },
  field: { gap: 8 },
  metaFields: { gap: 18 },
  metaFieldsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  metaField: { flex: 1 },
  metaFieldRow: { minWidth: 0 },
  foodList: { gap: 20 },
  inlineAddButton: { backgroundColor: '#DBEAFE', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  inlineAddButtonText: { color: '#1D4ED8', fontWeight: '800', fontSize: 13 },
  foodItemCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  foodItemContent: { gap: 10 },
  foodItemTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  foodItemLabelWrap: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  foodItemEmoji: { fontSize: 18, lineHeight: 22 },
  foodItemLabel: { flex: 1, minWidth: 0, color: '#0F172A', fontWeight: '800', fontSize: 15 },
  foodItemAmount: { color: '#0F172A', fontWeight: '900', fontSize: 18 },
  foodItemHint: { color: '#64748B', fontWeight: '600', fontSize: 12 },
  foodNameInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 8,
    color: '#0F172A',
  },
  foodAmountInput: {
    width: 96,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 8,
    textAlign: 'right',
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 18,
  },
  label: { color: '#0F172A', fontWeight: '800', fontSize: 15 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0' },
  amountInput: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', fontWeight: '800', fontSize: 18 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { backgroundColor: '#E2E8F0', color: '#0F172A', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, overflow: 'hidden', fontWeight: '700' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 2, borderWidth: 1 },
  summaryLabel: { color: '#64748B', fontWeight: '800', fontSize: 13 },
  summaryTotal: { color: '#0F172A', fontWeight: '900', fontSize: 24 },
  summaryHint: { color: '#64748B', lineHeight: 20 },
  helper: { color: '#64748B', lineHeight: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCount: { color: '#64748B', fontWeight: '700' },
  itemCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, gap: 10, borderWidth: 1, borderColor: 'transparent' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { color: '#0F172A', fontWeight: '800' },
  removeButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2' },
  removeButtonText: { color: '#DC2626', fontWeight: '900', fontSize: 18, lineHeight: 18 },
  dropdown: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownText: { color: '#0F172A', fontWeight: '700' },
  dropdownIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  pressed: { opacity: 0.8 },
  compactRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  flexInput: { flex: 1, minWidth: 0 },
  compactAmountInput: { width: 104, textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 12 },
  foodModalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  modalActionSecondary: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#E2E8F0' },
  modalActionSecondaryText: { color: '#0F172A', fontWeight: '800' },
  modalActionPrimary: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#2563EB' },
  modalActionPrimaryText: { color: '#FFFFFF', fontWeight: '800' },
  modalActionDanger: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FEE2E2' },
  modalActionDangerText: { color: '#DC2626', fontWeight: '800' },
  modalTitle: { color: '#0F172A', fontWeight: '900', fontSize: 16 },
  modalList: { gap: 8 },
  modalItem: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#F8FAFC' },
  modalItemText: { color: '#0F172A', fontWeight: '700' },
  error: { color: '#DC2626', fontWeight: '700' },
});
