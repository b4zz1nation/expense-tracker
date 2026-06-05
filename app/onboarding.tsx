import { router } from 'expo-router';
import { PiggyBank, Sparkles, UserRound } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../src/components/AppButton';
import { CategoryIcon } from '../src/components/CategoryIcon';
import { Screen } from '../src/components/Screen';
import { saveUserProfile } from '../src/db/settingsRepo';
import { parseMoneyToCents } from '../src/lib/currency';
import { useAppTheme } from '../src/theme/ThemeContext';

export default function OnboardingScreen() {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    Keyboard.dismiss();
    setSaving(true);
    try {
      const monthlyBudgetCents = parseMoneyToCents(budget);
      await saveUserProfile(name, monthlyBudgetCents);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Almost there', error instanceof Error ? error.message : 'Please check your details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboardAware>
      <View style={styles.heroCard}>
        <View style={styles.iconCluster}>
          <View style={[styles.iconBubble, styles.iconBubbleLarge]}>
            <CategoryIcon categoryId="bills" size={42} />
          </View>
          <View style={styles.iconBubbleSmall}>
            <Sparkles color={colors.primary} size={18} strokeWidth={2.6} />
          </View>
        </View>
        <Text style={styles.eyebrow}>Welcome</Text>
        <Text style={styles.title}>Build a calmer money routine.</Text>
        <Text style={styles.subtitle}>Set your name and monthly budget once. The app will scale that budget automatically when you switch calendar ranges.</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputRow}>
            <UserRound color={colors.textMuted} size={20} strokeWidth={2.4} />
            <TextInput
              autoCapitalize="words"
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Monthly budget</Text>
          <View style={styles.inputRow}>
            <PiggyBank color={colors.textMuted} size={20} strokeWidth={2.4} />
            <TextInput
              keyboardType="decimal-pad"
              placeholder="1200"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              style={styles.input}
              value={budget}
              onChangeText={setBudget}
            />
          </View>
          <Text style={styles.helper}>Used for month, range, and yearly budget comparisons.</Text>
        </View>

        <AppButton disabled={saving} onPress={finish}>{saving ? 'Saving…' : 'Start tracking'}</AppButton>
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    heroCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, gap: 10, padding: spacing.card },
    iconCluster: { alignItems: 'center', alignSelf: 'flex-start', justifyContent: 'center', marginBottom: 4 },
    iconBubble: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 24, justifyContent: 'center' },
    iconBubbleLarge: { height: 68, width: 68 },
    iconBubbleSmall: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, bottom: -2, height: 30, justifyContent: 'center', position: 'absolute', right: -8, width: 30 },
    eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
    title: { color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.8, lineHeight: 36 },
    subtitle: { color: colors.textMuted, fontSize: 15, fontWeight: '600', lineHeight: 22 },
    formCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, gap: spacing.md, padding: spacing.card },
    fieldGroup: { gap: 8 },
    label: { color: colors.text, fontSize: 14, fontWeight: '800' },
    inputRow: { alignItems: 'center', backgroundColor: colors.input, borderColor: colors.border, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 4 },
    input: { color: colors.text, flex: 1, fontSize: 16, minHeight: 46, paddingVertical: 8 },
    helper: { color: colors.textMuted, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  });
}
