import { Plus, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DEFAULT_BUDGET_CATEGORIES, createCategoryId } from '../lib/categoryBudgets';
import { formatCents, parseMoneyToCents } from '../lib/currency';
import { useAppTheme } from '../theme/ThemeContext';
import type { BudgetCategory } from '../types/categoryBudget';

const QUICK_EMOJIS = ['🍔', '⚡️', '📄', '🛒', '🏠', '🚗', '🎬', '💊', '✈️', '🐾'];
const COLORS = ['#F97316', '#EAB308', '#EF4444', '#64748B', '#3B82F6', '#A855F7', '#22C55E', '#EC4899', '#14B8A6'];

type Props = {
  categories: BudgetCategory[];
  currencyCode: string;
  onChange: (categories: BudgetCategory[]) => void;
};

function centsToInput(cents: number): string {
  return cents > 0 ? (cents / 100).toFixed(2) : '';
}

export function CategoryBudgetEditor({ categories, currencyCode, onChange }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('✨');

  const totalBudget = categories.reduce((total, category) => total + category.budgetCents, 0);
  const enabledIds = new Set(categories.map((category) => category.id));

  const updateCategory = (id: string, changes: Partial<BudgetCategory>) => {
    onChange(categories.map((category) => (category.id === id ? { ...category, ...changes } : category)));
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
    const emoji = customEmoji.trim();
    if (!name) {
      Alert.alert('Category name', 'Enter a name for the custom category.');
      return;
    }
    onChange([
      ...categories,
      { id: createCategoryId(name), name, emoji: emoji || '✨', color: COLORS[categories.length % COLORS.length], budgetCents: 0 },
    ]);
    setCustomName('');
    setCustomEmoji('✨');
  };

  const removeCategory = (id: string) => {
    onChange(categories.filter((category) => category.id !== id));
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
          return (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => toggleDefaultCategory(category)}
              style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
            >
              <Text style={styles.chipEmoji}>{category.emoji}</Text>
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
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
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
                value={centsToInput(category.budgetCents)}
                onChangeText={(value) => {
                  let budgetCents = 0;
                  try { budgetCents = value.trim() ? parseMoneyToCents(value) : 0; } catch { budgetCents = 0; }
                  updateCategory(category.id, { budgetCents });
                }}
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
        <View style={styles.quickEmojis}>
          {QUICK_EMOJIS.map((emoji) => (
            <Pressable key={emoji} onPress={() => setCustomEmoji(emoji)} style={[styles.emojiChip, customEmoji === emoji && styles.emojiChipSelected]}>
              <Text style={styles.emojiText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.customRow}>
          <TextInput
            value={customEmoji}
            onChangeText={setCustomEmoji}
            maxLength={4}
            style={styles.emojiInput}
            placeholder="✨"
            placeholderTextColor={colors.textMuted}
          />
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
      </View>
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
    categoryEmoji: { fontSize: 22, width: 28 },
    categoryNameInput: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '900', minWidth: 0, padding: 0 },
    categoryNameLocked: { color: colors.text },
    removeButton: { alignItems: 'center', backgroundColor: colors.expenseSoft, borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
    amountRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
    amountInput: { backgroundColor: colors.input, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, flex: 1, fontSize: 18, fontWeight: '900', paddingHorizontal: 12, paddingVertical: 10 },
    amountPreview: { color: colors.textMuted, fontWeight: '800', minWidth: 96, textAlign: 'right' },
    customCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, gap: 10, padding: spacing.md },
    customTitle: { color: colors.text, fontWeight: '900' },
    quickEmojis: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    emojiChip: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 999, borderWidth: 1, height: 34, justifyContent: 'center', width: 34 },
    emojiChipSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder },
    emojiText: { fontSize: 18 },
    customRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    emojiInput: { backgroundColor: colors.input, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: 18, minHeight: 46, paddingHorizontal: 10, textAlign: 'center', width: 56 },
    customNameInput: { backgroundColor: colors.input, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, flex: 1, minHeight: 46, paddingHorizontal: 12 },
    addButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 999, height: 46, justifyContent: 'center', width: 46 },
    pressed: { opacity: 0.82 },
  });
}
