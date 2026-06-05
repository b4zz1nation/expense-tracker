import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';

export function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      padding: theme.isCompact ? spacing.lg : 20,
      gap: spacing.sm,
    },
    label: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
    value: { color: colors.text, fontSize: theme.isCompact ? 30 : 36, fontWeight: '800' },
    helper: { color: colors.textMuted, fontSize: 14 },
  });
}
