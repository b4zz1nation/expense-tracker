import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = PropsWithChildren<{
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function AppButton({ children, onPress, variant = 'primary', disabled = false, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[variant], style, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <Text style={[styles.label, variant !== 'primary' && styles.secondaryLabel]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  primary: { backgroundColor: '#2563EB' },
  secondary: { backgroundColor: '#E2E8F0' },
  danger: { backgroundColor: '#FEE2E2' },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.9 },
  label: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  secondaryLabel: { color: '#0F172A' },
});
