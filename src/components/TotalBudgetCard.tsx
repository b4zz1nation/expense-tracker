import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatCents } from '../lib/currency';
import { useAppTheme } from '../theme/ThemeContext';

type Props = {
  spentCents: number;
  budgetCents: number;
  currencyCode: string;
};

export function TotalBudgetCard({ spentCents, budgetCents, currencyCode }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const progress = budgetCents > 0 ? Math.min(100, Math.max(0, (spentCents / budgetCents) * 100)) : 0;
  const overBudget = budgetCents > 0 && spentCents > budgetCents;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.label}>Total Budget</Text>
          <Text style={styles.value}>{formatCents(spentCents, currencyCode)} / {formatCents(budgetCents, currencyCode)}</Text>
        </View>
        <Text style={[styles.percent, overBudget && styles.percentOver]}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, overBudget && styles.fillOver, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    card: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, gap: 14, padding: spacing.card },
    headerRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
    label: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
    value: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 5 },
    percent: { color: colors.primary, fontSize: 15, fontWeight: '900' },
    percentOver: { color: colors.expense },
    track: { backgroundColor: colors.chartTrack, borderRadius: 999, height: 12, overflow: 'hidden' },
    fill: { backgroundColor: colors.primary, borderRadius: 999, height: '100%' },
    fillOver: { backgroundColor: colors.expense },
  });
}
