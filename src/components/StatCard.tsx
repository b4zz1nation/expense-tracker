import { StyleSheet, Text, View } from 'react-native';

export function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 8, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  label: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  value: { color: '#0F172A', fontSize: 36, fontWeight: '800' },
  helper: { color: '#64748B', fontSize: 14 },
});
