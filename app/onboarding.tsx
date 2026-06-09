import { router } from 'expo-router';
import { ArrowRight, ChevronLeft, PartyPopper, Search, Sparkles, UserRound, WalletCards, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../src/components/AppButton';
import { CategoryBudgetEditor } from '../src/components/CategoryBudgetEditor';
import { CategoryIcon } from '../src/components/CategoryIcon';
import { saveUserProfile, setPreferredCurrencyCode } from '../src/db/settingsRepo';
import { DEFAULT_BUDGET_CATEGORIES } from '../src/lib/categoryBudgets';
import { getCurrencyOption, getCurrencyOptions, getDeviceDefaultCurrencyCode, DEFAULT_CURRENCY_CODE, type CurrencyOption } from '../src/lib/currencies';
import { BRAND_FONT_FAMILY } from '../src/theme/fonts';
import { useAppTheme } from '../src/theme/ThemeContext';
import type { BudgetCategory } from '../src/types/categoryBudget';

const TOTAL_STEPS = 4;
type Step = 0 | 1 | 2 | 3;

export default function OnboardingScreen() {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.bottom, insets.top), [insets.bottom, insets.top, theme]);
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState<BudgetCategory[]>(DEFAULT_BUDGET_CATEGORIES);
  const [currencyCode, setCurrencyCode] = useState(() => getDeviceDefaultCurrencyCode());
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const transition = useRef(new Animated.Value(1)).current;
  const selectedCurrency = getCurrencyOption(currencyCode) ?? getCurrencyOption(DEFAULT_CURRENCY_CODE)!;
  const totalBudget = categoryBudgets.reduce((total, category) => total + category.budgetCents, 0);

  useEffect(() => {
    transition.setValue(0);
    Animated.timing(transition, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [step, transition]);

  const animatedStyle = { opacity: transition, transform: [{ translateY: transition.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] };

  const goNext = () => {
    Keyboard.dismiss();
    if (step === 1 && !name.trim()) {
      Alert.alert('One quick thing', 'Tell us what we should call you.');
      return;
    }
    if (step === 2 && totalBudget <= 0) {
      Alert.alert('Category budgets', 'Set at least one category budget before continuing.');
      return;
    }
    requestAnimationFrame(() => setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1) as Step));
  };

  const goBack = () => {
    Keyboard.dismiss();
    setStep((current) => Math.max(current - 1, 0) as Step);
  };

  const finish = async () => {
    Keyboard.dismiss();
    setSaving(true);
    try {
      await Promise.all([saveUserProfile(name, categoryBudgets), setPreferredCurrencyCode(currencyCode)]);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Almost there', error instanceof Error ? error.message : 'Please check your details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardRoot}>
      <View style={styles.pageShell}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" disabled={step === 0} onPress={goBack} style={({ pressed }) => [styles.backButton, step === 0 && styles.backButtonHidden, pressed && styles.pressed]}>
            <ChevronLeft color={colors.text} size={20} strokeWidth={2.6} />
          </Pressable>
          <Text style={styles.stepCount}>Step {step + 1} of {TOTAL_STEPS}</Text>
        </View>

        <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepScrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'} overScrollMode="never" bounces={false} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.stepCard, animatedStyle]}>
            {step === 0 ? <WelcomeStep /> : null}
            {step === 1 ? <NameStep name={name} onChangeName={setName} /> : null}
            {step === 2 ? (
              <BudgetStep
                categories={categoryBudgets}
                currency={selectedCurrency}
                onChangeCategories={setCategoryBudgets}
                onOpenCurrencyPicker={() => setCurrencyPickerOpen(true)}
              />
            ) : null}
            {step === 3 ? <FinishStep name={name} /> : null}
          </Animated.View>
        </ScrollView>

        <View style={styles.bottomControls}>
          <View style={styles.progressTrack}>{Array.from({ length: TOTAL_STEPS }).map((_, index) => <View key={index} style={[styles.progressDot, index <= step && styles.progressDotActive, index === step && styles.progressDotCurrent]} />)}</View>
          <AppButton disabled={saving} onPress={step === 3 ? finish : goNext}>{step === 3 ? (saving ? 'Saving…' : "Awesome, let's start tracking!") : 'Continue'}</AppButton>
          {step < 3 ? <Text style={styles.microcopy}>You can update these later from Settings → Profile.</Text> : null}
        </View>
      </View>

      <CurrencyPickerModal selectedCode={currencyCode} visible={currencyPickerOpen} onClose={() => setCurrencyPickerOpen(false)} onSelect={(code) => { setCurrencyCode(code); setCurrencyPickerOpen(false); }} />
    </KeyboardAvoidingView>
  );
}

function WelcomeStep() {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <>
    <View style={styles.heroIconWrap}><View style={styles.logoHeroIcon}><Image accessibilityLabel="Bean logo" source={require('../assets/bean/bean-icon-foreground 1.png')} style={styles.logoImage} /></View><View style={styles.floatingIconPrimary}><Sparkles color={colors.primary} size={20} strokeWidth={2.6} /></View></View>
    <Text style={styles.eyebrow}>Bean</Text><Text style={styles.title}>Track spending by category.</Text><Text style={styles.subtitle}>Create budgets for food, utilities, bills, others, and any custom categories you need.</Text>
    <View style={styles.featureRow}><FeaturePill icon={<WalletCards color={colors.primary} size={17} strokeWidth={2.5} />} label="Category budgets" /><FeaturePill icon={<CategoryIcon categoryId="food" emoji="🍔" size={18} />} label="Smart tracking" /></View>
  </>;
}

function NameStep({ name, onChangeName }: { name: string; onChangeName: (value: string) => void }) {
  const { theme } = useAppTheme(); const { colors } = theme; const styles = useMemo(() => createStyles(theme), [theme]);
  return <><View style={styles.stepIcon}><UserRound color={colors.primary} size={42} strokeWidth={2.4} /></View><Text style={styles.title}>What should Bean call you?</Text><Text style={styles.subtitle}>Your name personalizes the dashboard and profile.</Text><TextInput autoCapitalize="words" autoCorrect={false} autoFocus placeholder="Your name" placeholderTextColor={colors.textMuted} selectionColor={colors.primary} style={styles.textInput} value={name} onChangeText={onChangeName} /></>;
}

function BudgetStep({ categories, currency, onChangeCategories, onOpenCurrencyPicker }: { categories: BudgetCategory[]; currency: CurrencyOption; onChangeCategories: (value: BudgetCategory[]) => void; onOpenCurrencyPicker: () => void }) {
  const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <><View style={styles.stepIcon}><CategoryIcon categoryId="food" emoji="🍔" size={54} /></View><Text style={styles.title}>Set category budgets.</Text><Text style={styles.subtitle}>Select defaults, add custom categories, and set monthly amounts for each.</Text><Pressable onPress={onOpenCurrencyPicker} style={({ pressed }) => [styles.currencyButton, pressed && styles.pressed]}><Text style={styles.currencyButtonLabel}>Currency</Text><Text style={styles.currencyButtonValue}>{currency.flagEmoji} {currency.code} · {currency.name}</Text></Pressable><CategoryBudgetEditor categories={categories} currencyCode={currency.code} onChange={onChangeCategories} /></>;
}

function FinishStep({ name }: { name: string }) {
  const { theme } = useAppTheme(); const { colors } = theme; const styles = useMemo(() => createStyles(theme), [theme]);
  return <><View style={styles.stepIcon}><PartyPopper color={colors.primary} size={46} strokeWidth={2.4} /></View><Text style={styles.title}>Awesome{name.trim() ? `, ${name.trim()}` : ''}.</Text><Text style={styles.subtitle}>Your category budgets are ready. Add expenses against each category and Bean will track total and per-category progress.</Text><View style={styles.finishArrow}><ArrowRight color={colors.onPrimary} size={26} strokeWidth={2.8} /></View></>;
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.featurePill}>{icon}<Text style={styles.featurePillText}>{label}</Text></View>;
}

function CurrencyPickerModal({ selectedCode, visible, onClose, onSelect }: { selectedCode: string; visible: boolean; onClose: () => void; onSelect: (code: string) => void }) {
  const { theme } = useAppTheme(); const { colors } = theme; const styles = useMemo(() => createStyles(theme), [theme]); const [query, setQuery] = useState('');
  const options = useMemo(() => { const q = query.trim().toLowerCase(); return getCurrencyOptions().filter((entry) => !q || [entry.code, entry.name, entry.symbol].some((value) => value.toLowerCase().includes(q))).slice(0, 80); }, [query]);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.currencyOverlay}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} /><View style={styles.currencySheet}><View style={styles.currencySheetHeader}><View><Text style={styles.currencySheetTitle}>Choose currency</Text><Text style={styles.currencySheetSubtitle}>Used for budgets and expenses.</Text></View><Pressable onPress={onClose} style={styles.currencyClose}><X color={colors.textMuted} size={20} /></Pressable></View><View style={styles.searchBox}><Search color={colors.textMuted} size={18} /><TextInput value={query} onChangeText={setQuery} placeholder="Search currency" placeholderTextColor={colors.textMuted} style={styles.searchInput} /></View><FlatList data={options} keyExtractor={(item) => item.code} keyboardShouldPersistTaps="handled" renderItem={({ item }) => <Pressable onPress={() => onSelect(item.code)} style={[styles.currencyRow, selectedCode === item.code && styles.currencyRowSelected]}><Text style={styles.currencyFlag}>{item.flagEmoji}</Text><View style={styles.currencyText}><Text style={styles.currencyCode}>{item.code}</Text><Text style={styles.currencyName}>{item.name}</Text></View></Pressable>} /></View></View></Modal>;
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme'], bottomInset = 0, topInset = 0) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    keyboardRoot: { flex: 1, backgroundColor: colors.background }, pageShell: { flex: 1, paddingTop: Math.max(topInset, spacing.lg) }, topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.screen }, backButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 999, height: 38, justifyContent: 'center', width: 38 }, backButtonHidden: { opacity: 0 }, stepCount: { color: colors.textMuted, fontWeight: '800' }, pressed: { opacity: 0.8 }, stepScroll: { flex: 1 }, stepScrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.screen }, stepCard: { alignItems: 'center', gap: spacing.md }, bottomControls: { backgroundColor: colors.background, gap: spacing.md, paddingBottom: Math.max(bottomInset + 12, spacing.lg), paddingHorizontal: spacing.screen, paddingTop: spacing.md }, progressTrack: { flexDirection: 'row', gap: 7, justifyContent: 'center' }, progressDot: { backgroundColor: colors.surfaceMuted, borderRadius: 999, height: 8, width: 8 }, progressDotActive: { backgroundColor: colors.primarySoftBorder }, progressDotCurrent: { backgroundColor: colors.primary, width: 24 }, microcopy: { color: colors.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center' }, heroIconWrap: { height: 132, justifyContent: 'center', alignItems: 'center', width: 150 }, logoHeroIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 34, height: 104, justifyContent: 'center', width: 104 }, logoImage: { height: 82, resizeMode: 'contain', width: 82 }, floatingIconPrimary: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 999, height: 38, justifyContent: 'center', position: 'absolute', right: 14, top: 12, width: 38 }, stepIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 30, height: 84, justifyContent: 'center', width: 84 }, eyebrow: { color: colors.primary, fontSize: 13, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }, title: { color: colors.text, fontFamily: BRAND_FONT_FAMILY, fontSize: 30, lineHeight: 36, textAlign: 'center' }, subtitle: { color: colors.textMuted, fontSize: 15, fontWeight: '600', lineHeight: 22, textAlign: 'center' }, featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }, featurePill: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8 }, featurePillText: { color: colors.textSecondary, fontWeight: '800' }, textInput: { backgroundColor: colors.input, borderColor: colors.border, borderRadius: 18, borderWidth: 1, color: colors.text, fontSize: 18, minHeight: 54, paddingHorizontal: 16, width: '100%' }, currencyButton: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, gap: 2, padding: 14, width: '100%' }, currencyButtonLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }, currencyButtonValue: { color: colors.text, fontWeight: '900' }, finishArrow: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 999, height: 58, justifyContent: 'center', width: 58 }, currencyOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }, currencySheet: { backgroundColor: colors.sheet, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12, maxHeight: '78%', padding: spacing.screen }, currencySheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, currencySheetTitle: { color: colors.text, fontSize: 22, fontWeight: '900' }, currencySheetSubtitle: { color: colors.textMuted, fontWeight: '600' }, currencyClose: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 999, height: 36, justifyContent: 'center', width: 36 }, searchBox: { alignItems: 'center', backgroundColor: colors.input, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 12 }, searchInput: { color: colors.text, flex: 1, minHeight: 44 }, currencyRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, marginBottom: 8, padding: 12 }, currencyRowSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }, currencyFlag: { fontSize: 20 }, currencyText: { flex: 1 }, currencyCode: { color: colors.text, fontWeight: '900' }, currencyName: { color: colors.textMuted, fontWeight: '600' },
  });
}
