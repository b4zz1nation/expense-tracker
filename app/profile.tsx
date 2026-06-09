import { useFocusEffect } from 'expo-router';
import { UserRound, WalletCards } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../src/components/AppButton';
import { CategoryBudgetEditor } from '../src/components/CategoryBudgetEditor';
import { CategoryIcon } from '../src/components/CategoryIcon';
import { Screen } from '../src/components/Screen';
import { getPreferredCurrencyCode } from '../src/db/settingsRepo';
import { useProfile } from '../src/hooks/useProfile';
import { DEFAULT_BUDGET_CATEGORIES, totalCategoryBudgetCents } from '../src/lib/categoryBudgets';
import { formatCents } from '../src/lib/currency';
import { BRAND_FONT_FAMILY } from '../src/theme/fonts';
import { useAppTheme } from '../src/theme/ThemeContext';
import type { BudgetCategory } from '../src/types/categoryBudget';

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { profile, loadingProfile, refreshProfile, updateProfile } = useProfile();
  const [name, setName] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState<BudgetCategory[]>(DEFAULT_BUDGET_CATEGORIES);
  const [currencyCode, setCurrencyCode] = useState('PHP');
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    void refreshProfile();
    void (async () => setCurrencyCode(await getPreferredCurrencyCode()))();
  }, [refreshProfile]));

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setCategoryBudgets(profile.categoryBudgets);
  }, [profile]);

  const monthlyBudgetCents = totalCategoryBudgetCents(categoryBudgets);

  const save = async () => {
    Keyboard.dismiss();
    setSaving(true);
    try {
      await updateProfile(name, categoryBudgets);
      Alert.alert('Profile saved', 'Your category budgets were updated.');
    } catch (error) {
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboardAware>
      <View style={styles.headerCard}>
        <View style={styles.profileIcon}>
          <CategoryIcon categoryId="shopping" emoji="🛍️" size={42} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Profile</Text>
          <Text style={styles.title}>{profile?.name ? `Hi, ${profile.name}` : 'Your profile'}</Text>
          <Text style={styles.subtitle}>Manage your name, categories, and per-category monthly budgets.</Text>
        </View>
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
        <AppButton disabled={saving || loadingProfile} onPress={save}>{saving ? 'Saving…' : 'Save profile'}</AppButton>
      </View>

      <CategoryBudgetEditor categories={categoryBudgets} currencyCode={currencyCode} onChange={setCategoryBudgets} />

      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <WalletCards color={colors.primary} size={22} strokeWidth={2.5} />
          <Text style={styles.previewTitle}>Budget scaling</Text>
        </View>
        <View style={styles.previewGrid}>
          <BudgetPreview label="Monthly total" value={formatCents(monthlyBudgetCents, currencyCode)} />
          <BudgetPreview label="6-month span" value={formatCents(monthlyBudgetCents * 6, currencyCode)} />
          <BudgetPreview label="Yearly" value={formatCents(monthlyBudgetCents * 12, currencyCode)} />
        </View>
      </View>
    </Screen>
  );
}

function BudgetPreview({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.budgetPreview}>
      <Text style={styles.budgetPreviewLabel}>{label}</Text>
      <Text style={styles.budgetPreviewValue}>{value}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    headerCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 14, padding: spacing.card },
    profileIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 22, height: 64, justifyContent: 'center', width: 64 },
    headerText: { flex: 1, gap: 3 },
    eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
    title: { color: colors.text, fontFamily: BRAND_FONT_FAMILY, fontSize: 24, lineHeight: 30 },
    subtitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600', lineHeight: 19 },
    formCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, gap: spacing.md, padding: spacing.card },
    fieldGroup: { gap: 8 },
    label: { color: colors.text, fontSize: 14, fontWeight: '800' },
    inputRow: { alignItems: 'center', backgroundColor: colors.input, borderColor: colors.border, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 4 },
    input: { color: colors.text, flex: 1, fontSize: 16, minHeight: 46, paddingVertical: 8 },
    previewCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, gap: spacing.md, padding: spacing.card },
    previewHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    previewTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
    previewGrid: { gap: 8 },
    budgetPreview: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
    budgetPreviewLabel: { color: colors.textMuted, fontWeight: '800' },
    budgetPreviewValue: { color: colors.text, fontSize: 16, fontWeight: '900' },
  });
}
