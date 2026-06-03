import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getCategory } from '../constants/categories';
import { formatCents } from '../lib/currency';
import { formatDateLabel } from '../lib/dates';
import type { Expense } from '../types/expense';

export function ExpenseItem({
  expense,
  currencyCode,
  onPress,
}: {
  expense: Expense;
  currencyCode: string;
  onPress?: () => void;
}) {
  const category = getCategory(expense.categoryId);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.icon, { backgroundColor: `${category.color}22` }]}>
        <Text>{category.emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{expense.note || category.name}</Text>
        <Text style={styles.meta}>{category.name} · {formatDateLabel(expense.spentOn)}</Text>
      </View>
      <Text style={styles.amount}>-{formatCents(expense.amountCents, currencyCode)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16 },
  pressed: { opacity: 0.8 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  title: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
  meta: { color: '#64748B', fontSize: 13 },
  amount: { color: '#DC2626', fontWeight: '800' },
});
