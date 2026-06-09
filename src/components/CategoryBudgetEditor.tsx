import { Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DEFAULT_BUDGET_CATEGORIES, createCategoryId } from '../lib/categoryBudgets';
import { formatCents } from '../lib/currency';
import { useAppTheme } from '../theme/ThemeContext';
import type { BudgetCategory } from '../types/categoryBudget';
import { OpenMojiEmojiPicker } from './OpenMojiEmojiPicker';

const COLORS = ['#F97316', '#EAB308', '#EF4444', '#64748B', '#3B82F6', '#A855F7', '#22C55E', '#EC4899', '#14B8A6'];

type Props = {
  categories: BudgetCategory[];
  currencyCode: string;
  onChange: (categories: BudgetCategory[]) => void;
};

function centsToInput(cents: number): string {
  return cents > 0 ? (cents / 100).toFixed(2) : '';
}

function parseBudgetInput(value: string): number {
  const normalized = value.replace(',', '.').trim();
  if (!normalized || normalized === '.') return 0;
  const withWholePart = normalized.startsWith('.') ? `0${normalized}` : normalized;
  const [whole = '0', fraction = ''] = withWholePart.split('.');
  const cents = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : 0;
}

export function CategoryBudgetEditor({ categories, currencyCode, onChange }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const [customName, setCustomName] = useState('');
  const [amountInputs, setAmountInputs] = useState<Record<string, string>>(() => Object.fromEntries(categories.map((category) => [category.id, centsToInput(category.budgetCents)])));
  const [emojiPickerCategoryId, setEmojiPickerCategoryId] = useState<string | null>(null);

  useEffect(() => {
    setAmountInputs((current) => {
      const next: Record<string, string> = {};
      categories.forEach((category) => {
        next[category.id] = current[category.id] ?? centsToInput(category.budgetCents);
      });
      return next;
    });
  }, [categories]);

  const totalBudget = categories.reduce((total, category) => total + category.budgetCents, 0);
  const enabledIds = new Set(categories.map((category) => category.id));
  const emojiPickerCategory = categories.find((category) => category.id === emojiPickerCategoryId) ?? null;

  const updateCategory = (id: string, changes: Partial<BudgetCategory>) => {
    onChange(categories.map((category) => (category.id === id ? { ...category, ...changes } : category)));
  };

  const updateBudgetInput = (id: string, value: string) => {
    const sanitized = value.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
    if (!/^\d*(\.\d{0,2})?$/.test(sanitized)) return;
    setAmountInputs((current) => ({ ...current, [id]: sanitized }));
    try {
      updateCategory(id, { budgetCents: parseBudgetInput(sanitized) });
    } catch {
      // Keep the user's in-progress value editable; validation happens as they finish typing.
    }
  };

  const blurBudgetInput = (category: BudgetCategory) => {
    setAmountInputs((current) => ({ ...current, [category.id]: centsToInput(category.budgetCents) }));
  };

  const toggleDefaultCategory = (category: BudgetCategory) => {
    if (enabledIds.has(category.id)) {
      onChange(categories.filter((entry) => entry.id !== category.id));
      return;
    }
    onChange([...categories, { ...category, budgetCents: 0 }]);
  };

  const addCustomCategory = () => {
    const name = customName.trim();
    if (!name) {
      Alert.alert('Category name', 'Enter a name for the custom category.');
      return;
    }
    onChange([
      ...categories,
      { id: createCategoryId(name), name, emoji: '✨', color: COLORS[categories.length % COLORS.length], budgetCents: 0 },
    ]);
    setCustomName('');
  };

  const removeCategory = (id: string) => {
    onChange(categories.filter((category) => category.id !== id));
  };

  const selectEmoji = (emoji: string) => {
    if (!emojiPickerCategoryId) return;
    updateCategory(emojiPickerCategoryId, { emoji });
  };

  return (
    <View style={styles.root}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total monthly budget</Text>
        <Text style={styles.totalValue}>{formatCents(totalBudget, currencyCode)}</Text>
      </View>

      <View style={styles.defaultChips}>
        {DEFAULT_BUDGET_CATEGORIES.map((category) => {
          const selected = enabledIds.has(category.id);
          const currentCategory = categories.find((entry) => entry.id === category.id) ?? category;
          return (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => toggleDefaultCategory(category)}
              style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
            >
              <Text style={styles.chipEmoji}>{currentCategory.emoji}</Text>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{category.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.list}>
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Choose emoji for ${category.name}`}
                  onPress={() => setEmojiPickerCategoryId(category.id)}
                  style={({ pressed }) => [styles.categoryEmojiButton, pressed && styles.pressed]}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                </Pressable>
                <TextInput
                  value={category.name}
                  editable={!category.isDefault}
                  onChangeText={(name) => updateCategory(category.id, { name })}
                  style={[styles.categoryNameInput, category.isDefault && styles.categoryNameLocked]}
                  placeholder="Category"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${category.name}`}
                onPress={() => removeCategory(category.id)}
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
              >
                <Trash2 color={colors.expense} size={17} strokeWidth={2.5} />
              </Pressable>
            </View>
            <View style={styles.amountRow}>
              <TextInput
                keyboardType="decimal-pad"
                value={amountInputs[category.id] ?? ''}
                onChangeText={(value) => updateBudgetInput(category.id, value)}
                onBlur={() => blurBudgetInput(category)}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primary}
                style={styles.amountInput}
              />
              <Text style={styles.amountPreview}>{formatCents(category.budgetCents, currencyCode)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.customCard}>
        <Text style={styles.customTitle}>Add custom category</Text>
        <View style={styles.customRow}>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            style={styles.customNameInput}
            placeholder="Category name"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
          />
          <Pressable onPress={addCustomCategory} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Plus color={colors.onPrimary} size={20} strokeWidth={2.7} />
          </Pressable>
        </View>
        <Text style={styles.customHint}>New custom categories start with ✨. Tap the emoji on the category row to choose from the full OpenMoji set.</Text>
      </View>

      <OpenMojiEmojiPicker
        visible={emojiPickerCategoryId !== null}
        selectedEmoji={emojiPickerCategory?.emoji}
        title={emojiPickerCategory ? `Choose ${emojiPickerCategory.name} emoji` : 'Choose emoji'}
        onClose={() => setEmojiPickerCategoryId(null)}
        onSelect={selectEmoji}
      />
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    root: { gap: spacing.md },
    totalCard: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: spacing.card },
    totalLabel: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.4, textTransform: 'uppercase' },
    totalValue: { color: colors.text, fontSize: 26, fontWeight: '900', marginTop: 4 },
    defaultChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 9 },
    chipSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder },
    chipEmoji: { fontSize: 16 },
    chipText: { color: colors.textSecondary, fontWeight: '800' },
    chipTextSelected: { color: colors.primary },
    list: { gap: 10 },
    categoryCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, gap: 10, padding: spacing.md },
    categoryHeader: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
    categoryTitleRow: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10, minWidth: 0 },
    categoryEmojiButton: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, height: 38, justifyContent: 'center', width: 38 },
    categoryEmoji: { fontSize: 22, lineHeight: 28 },
    categoryNameInput: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '900', minWidth: 0, padding: 0 },
    categoryNameLocked: { color: colors.text },
    removeButton: { alignItems: 'center', backgroundColor: colors.expenseSoft, borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
    amountRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
    amountInput: { backgroundColor: colors.input, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, flex: 1, fontSize: 18, fontWeight: '900', paddingHorizontal: 12, paddingVertical: 10 },
    amountPreview: { color: colors.textMuted, fontWeight: '800', minWidth: 96, textAlign: 'right' },
    customCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, gap: 10, padding: spacing.md },
    customTitle: { color: colors.text, fontWeight: '900' },
    customRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    customNameInput: { backgroundColor: colors.input, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, flex: 1, minHeight: 46, paddingHorizontal: 12 },
    customHint: { color: colors.textMuted, fontSize: 12, fontWeight: '700', lineHeight: 17 },
    addButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 999, height: 46, justifyContent: 'center', width: 46 },
    pressed: { opacity: 0.82 },
  });
}
