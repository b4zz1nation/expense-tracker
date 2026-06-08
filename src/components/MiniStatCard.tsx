import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';

export type MiniStatTone = 'primary' | 'income' | 'warning' | 'expense';

export function MiniStatCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper?: string;
  tone: MiniStatTone;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { colors } = theme;
  const toneStyle = {
    primary: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder, accentColor: colors.primary },
    income: { backgroundColor: colors.incomeSoft, borderColor: colors.income, accentColor: colors.onIncomeSoft },
    warning: { backgroundColor: colors.warningSoft, borderColor: colors.warning, accentColor: colors.onWarningSoft },
    expense: { backgroundColor: colors.expenseSoft, borderColor: colors.expense, accentColor: colors.onExpenseSoft },
  }[tone];

  return (
    <View style={[styles.card, { backgroundColor: toneStyle.backgroundColor, borderColor: toneStyle.borderColor }]}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: toneStyle.accentColor }]} />
        <Text style={[styles.label, { color: toneStyle.accentColor }]} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{value}</Text>
      {helper ? <Text style={styles.helper} numberOfLines={1}>{helper}</Text> : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors } = theme;
  return StyleSheet.create({
    card: {
      flex: 1,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 4,
      minHeight: 92,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    header: { alignItems: 'center', flexDirection: 'row', gap: 6 },
    dot: { borderRadius: 999, height: 7, width: 7 },
    label: { fontSize: 12, fontWeight: '900', letterSpacing: 0.4, textTransform: 'uppercase' },
    value: { color: colors.text, fontSize: theme.isCompact ? 22 : 24, fontWeight: '900', lineHeight: theme.isCompact ? 27 : 29 },
    helper: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  });
}
