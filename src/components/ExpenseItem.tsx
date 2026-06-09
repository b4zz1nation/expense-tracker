import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getCategory } from '../constants/categories';
import { CategoryIcon } from './CategoryIcon';
import { formatCents } from '../lib/currency';
import { formatDateLabel } from '../lib/dates';
import { useAppTheme } from '../theme/ThemeContext';
import type { BudgetCategory } from '../types/categoryBudget';
import type { Expense } from '../types/expense';

export function ExpenseItem({
  expense,
  currencyCode,
  onPress,
  categories,
}: {
  expense: Expense;
  currencyCode: string;
  onPress?: () => void;
  categories?: BudgetCategory[];
}) {
  const category = getCategory(expense.categoryId, categories);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.icon, { backgroundColor: `${category.color}${theme.isDark ? '33' : '22'}` }]}>
        <CategoryIcon categoryId={category.id} emoji={category.emoji} size={26} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{expense.note || category.name}</Text>
        <Text style={styles.meta}>{category.name} · {formatDateLabel(expense.spentOn)}</Text>
      </View>
      <Text style={styles.amount}>-{formatCents(expense.amountCents, currencyCode)}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors } = theme;
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      padding: theme.isCompact ? 12 : 14,
    },
    pressed: { opacity: 0.8 },
    icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    body: { flex: 1, gap: 2 },
    title: { color: colors.text, fontSize: 16, fontWeight: '700' },
    meta: { color: colors.textMuted, fontSize: 13 },
    amount: { color: colors.expense, fontWeight: '800' },
  });
}
