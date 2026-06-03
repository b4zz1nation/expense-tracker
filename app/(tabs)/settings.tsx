import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../src/components/AppButton';
import { Screen } from '../../src/components/Screen';
import { clearExpenses } from '../../src/db/expensesRepo';

export default function SettingsScreen() {
  const clear = async () => {
    Alert.alert('Clear all expenses?', 'This removes all expenses from normal views. This action cannot be undone in the app yet.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await clearExpenses();
            Alert.alert('Data cleared', 'All expenses were removed.');
          })();
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>Currency</Text>
        <Text style={styles.text}>USD for the MVP. The data model stores currency per expense for future support.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Storage</Text>
        <Text style={styles.text}>Local-first SQLite database. Expenses stay on this device.</Text>
      </View>
      <AppButton variant="danger" onPress={clear}>Clear All Expenses</AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 8 },
  title: { color: '#0F172A', fontWeight: '800', fontSize: 18 },
  text: { color: '#64748B', lineHeight: 20 },
});
