import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';

export function EmptyState({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <AppButton onPress={onAction}>{actionLabel}</AppButton> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, gap: 12, alignItems: 'center' },
  title: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  message: { color: '#64748B', textAlign: 'center', lineHeight: 20 },
});
