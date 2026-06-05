import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';

type Props = PropsWithChildren<{
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function AppButton({ children, onPress, variant = 'primary', disabled = false, style }: Props) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[variant], style, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel, variant === 'danger' && styles.dangerLabel]}>{children}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors } = theme;
  return StyleSheet.create({
    button: { borderRadius: 14, paddingVertical: theme.isCompact ? 12 : 14, paddingHorizontal: 16, alignItems: 'center' },
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.surfaceMuted },
    danger: { backgroundColor: colors.expenseSoft },
    disabled: { opacity: 0.5 },
    pressed: { transform: [{ scale: 0.99 }], opacity: 0.9 },
    label: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
    secondaryLabel: { color: colors.text },
    dangerLabel: { color: colors.onExpenseSoft },
  });
}
