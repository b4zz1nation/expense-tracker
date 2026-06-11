import { useFocusEffect, useNavigation } from 'expo-router';
import { Check, Edit3 } from 'lucide-react-native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, LayoutAnimation, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CategoryBudgetEditor } from '../src/components/CategoryBudgetEditor';
import { CategoryIcon } from '../src/components/CategoryIcon';
import { Screen } from '../src/components/Screen';
import { getPreferredCurrencyCode } from '../src/db/settingsRepo';
import { useProfile } from '../src/hooks/useProfile';
import { DEFAULT_BUDGET_CATEGORIES } from '../src/lib/categoryBudgets';
import { BRAND_FONT_FAMILY } from '../src/theme/fonts';
import { useAppTheme } from '../src/theme/ThemeContext';
import type { BudgetCategory } from '../src/types/categoryBudget';

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const { profile, loadingProfile, refreshProfile, updateProfile } = useProfile();
  const [name, setName] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState<BudgetCategory[]>(DEFAULT_BUDGET_CATEGORIES);
  const [currencyCode, setCurrencyCode] = useState('PHP');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useFocusEffect(useCallback(() => {
    void refreshProfile();
    void (async () => setCurrencyCode(await getPreferredCurrencyCode()))();
  }, [refreshProfile]));

  useEffect(() => {
    if (!profile || editing) return;
    setName(profile.name);
    setCategoryBudgets(profile.categoryBudgets);
  }, [editing, profile]);

  const animateEditChange = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const startEditing = () => {
    animateEditChange();
    setEditing(true);
  };

  const save = async () => {
    Keyboard.dismiss();
    setSaving(true);
    try {
      await updateProfile(name.trim() || 'Friend', categoryBudgets);
      await refreshProfile();
      animateEditChange();
      setEditing(false);
    } catch (error) {
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Save profile' : 'Edit profile'}
          disabled={saving || loadingProfile}
          onPress={editing ? save : startEditing}
          style={({ pressed }) => [styles.headerAction, editing && styles.headerActionPrimary, pressed && styles.pressed, (saving || loadingProfile) && styles.disabled]}
        >
          {editing ? <Check color={colors.onPrimary} size={18} strokeWidth={2.8} /> : <Edit3 color={colors.primary} size={18} strokeWidth={2.6} />}
          <Text style={[styles.headerActionText, editing && styles.headerActionTextPrimary]}>{editing ? (saving ? 'Saving…' : 'Done') : 'Edit'}</Text>
        </Pressable>
      ),
    });
  }, [colors.onPrimary, colors.primary, editing, loadingProfile, navigation, saving, styles]);

  return (
    <Screen keyboardAware>
      <View style={styles.headerCard}>
        <View style={styles.profileIcon}>
          <CategoryIcon categoryId="shopping" emoji="🛍️" size={42} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Profile</Text>
          {editing ? (
            <TextInput
              autoCapitalize="words"
              autoFocus
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              style={styles.titleInput}
              value={name}
              onChangeText={setName}
              returnKeyType="done"
              onSubmitEditing={save}
            />
          ) : (
            <Text style={styles.title}>{name ? `Hi, ${name}` : 'Your profile'}</Text>
          )}
          <Text style={styles.subtitle}>{editing ? 'Edit your name and category budgets.' : 'Your category budgets and profile details.'}</Text>
        </View>
      </View>

      <CategoryBudgetEditor
        categories={categoryBudgets}
        currencyCode={currencyCode}
        onChange={setCategoryBudgets}
        editable={editing}
        showDefaultCategories={false}
      />
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    headerCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, padding: spacing.card },
    profileIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 22, height: 64, justifyContent: 'center', width: 64 },
    headerText: { flex: 1, gap: 3, minWidth: 0 },
    eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
    title: { color: colors.text, fontFamily: BRAND_FONT_FAMILY, fontSize: 24, lineHeight: 30 },
    titleInput: { backgroundColor: colors.input, borderColor: colors.primarySoftBorder, borderRadius: 16, borderWidth: 1, color: colors.text, fontFamily: BRAND_FONT_FAMILY, fontSize: 22, lineHeight: 28, minHeight: 44, paddingHorizontal: 12, paddingVertical: 6 },
    subtitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600', lineHeight: 19 },
    headerAction: { alignItems: 'center', backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 9 },
    headerActionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
    headerActionText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
    headerActionTextPrimary: { color: colors.onPrimary },
    pressed: { opacity: 0.82 },
    disabled: { opacity: 0.55 },
  });
}
