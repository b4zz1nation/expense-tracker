import { router } from 'expo-router';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, PartyPopper, PiggyBank, Search, Sparkles, UserRound, WalletCards, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Animated, FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../src/components/AppButton';
import { CategoryIcon } from '../src/components/CategoryIcon';
import { saveUserProfile, setPreferredCurrencyCode } from '../src/db/settingsRepo';
import { getCurrencyOption, getCurrencyOptions, getDeviceDefaultCurrencyCode, DEFAULT_CURRENCY_CODE, type CurrencyOption } from '../src/lib/currencies';
import { parseMoneyToCents } from '../src/lib/currency';
import { useAppTheme } from '../src/theme/ThemeContext';

const TOTAL_STEPS = 4;

type Step = 0 | 1 | 2 | 3;

export default function OnboardingScreen() {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.bottom, insets.top), [insets.bottom, insets.top, theme]);
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [currencyCode, setCurrencyCode] = useState(() => getDeviceDefaultCurrencyCode());
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const transition = useRef(new Animated.Value(1)).current;

  const selectedCurrency = getCurrencyOption(currencyCode) ?? getCurrencyOption(DEFAULT_CURRENCY_CODE)!;

  useEffect(() => {
    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [step, transition]);

  const animatedStyle = {
    opacity: transition,
    transform: [{ translateY: transition.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  const goNext = () => {
    Keyboard.dismiss();
    if (step === 1 && !name.trim()) {
      Alert.alert('One quick thing', 'Tell us what we should call you.');
      return;
    }
    if (step === 2) {
      try {
        parseMoneyToCents(budget);
      } catch {
        Alert.alert('Monthly budget', 'Enter a valid monthly budget before continuing.');
        return;
      }
    }
    requestAnimationFrame(() => {
      setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1) as Step);
    });
  };

  const goBack = () => {
    Keyboard.dismiss();
    setStep((current) => Math.max(current - 1, 0) as Step);
  };

  const finish = async () => {
    Keyboard.dismiss();
    setSaving(true);
    try {
      const monthlyBudgetCents = parseMoneyToCents(budget);
      await Promise.all([
        saveUserProfile(name, monthlyBudgetCents),
        setPreferredCurrencyCode(currencyCode),
      ]);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Almost there', error instanceof Error ? error.message : 'Please check your details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardRoot}
    >
      <View style={styles.pageShell}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            disabled={step === 0}
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, step === 0 && styles.backButtonHidden, pressed && styles.pressed]}
          >
            <ChevronLeft color={colors.text} size={20} strokeWidth={2.6} />
          </Pressable>
          <Text style={styles.stepCount}>Step {step + 1} of {TOTAL_STEPS}</Text>
        </View>

        <ScrollView
          style={styles.stepScroll}
          contentContainerStyle={styles.stepScrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
          overScrollMode="never"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.stepCard, animatedStyle]}>
            {step === 0 ? <WelcomeStep /> : null}
            {step === 1 ? <NameStep name={name} onChangeName={setName} /> : null}
            {step === 2 ? (
              <BudgetStep
                budget={budget}
                currency={selectedCurrency}
                onChangeBudget={setBudget}
                onOpenCurrencyPicker={() => setCurrencyPickerOpen(true)}
              />
            ) : null}
            {step === 3 ? <FinishStep name={name} /> : null}
          </Animated.View>
        </ScrollView>

        <View style={styles.bottomControls}>
          <View style={styles.progressTrack}>
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <View key={index} style={[styles.progressDot, index <= step && styles.progressDotActive, index === step && styles.progressDotCurrent]} />
            ))}
          </View>
          <AppButton disabled={saving} onPress={step === 3 ? finish : goNext}>
            {step === 3 ? (saving ? 'Saving…' : "Let's start tracking") : 'Continue'}
          </AppButton>
          {step < 3 ? (
            <Text style={styles.microcopy}>You can update these details later from Settings → Profile.</Text>
          ) : null}
        </View>
      </View>

      <CurrencyPickerModal
        selectedCode={currencyCode}
        visible={currencyPickerOpen}
        onClose={() => setCurrencyPickerOpen(false)}
        onSelect={(code) => {
          setCurrencyCode(code);
          setCurrencyPickerOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function WelcomeStep() {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <View style={styles.heroIconWrap}>
        <View style={styles.logoHeroIcon}>
          <Image accessibilityLabel="Bean logo" source={require('../assets/bean/bean-icon-foreground 1.png')} style={styles.logoImage} />
        </View>
        <View style={styles.floatingIconPrimary}>
          <Sparkles color={colors.primary} size={20} strokeWidth={2.6} />
        </View>
      </View>
      <Text style={styles.eyebrow}>Bean</Text>
      <Text style={styles.title}>Track spending without the noise.</Text>
      <Text style={styles.subtitle}>A clean, local-first budget companion for daily expenses, calendar ranges, and quick category insights.</Text>
      <View style={styles.featureRow}>
        <FeaturePill icon={<WalletCards color={colors.primary} size={17} strokeWidth={2.5} />} label="Smart budgets" />
        <FeaturePill icon={<CategoryIcon categoryId="shopping" size={18} />} label="Visual categories" />
      </View>
    </>
  );
}

function NameStep({ name, onChangeName }: { name: string; onChangeName: (value: string) => void }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <View style={styles.smallIconBubble}>
        <UserRound color={colors.primary} size={34} strokeWidth={2.4} />
      </View>
      <Text style={styles.eyebrow}>Personalize</Text>
      <Text style={styles.title}>What should we call you?</Text>
      <Text style={styles.subtitle}>Your name is used to make the dashboard and profile feel more personal.</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Name</Text>
        <View style={styles.inputRow}>
          <UserRound color={colors.textMuted} size={20} strokeWidth={2.4} />
          <TextInput
            autoCapitalize="words"
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            returnKeyType="next"
            selectionColor={colors.primary}
            style={styles.input}
            value={name}
            onChangeText={onChangeName}
          />
        </View>
      </View>
    </>
  );
}

function BudgetStep({ budget, currency, onChangeBudget, onOpenCurrencyPicker }: { budget: string; currency: CurrencyOption; onChangeBudget: (value: string) => void; onOpenCurrencyPicker: () => void }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <View style={styles.smallIconBubble}>
        <PiggyBank color={colors.primary} size={36} strokeWidth={2.4} />
      </View>
      <Text style={styles.eyebrow}>Budget baseline</Text>
      <Text style={styles.title}>Set your monthly budget.</Text>
      <Text style={styles.subtitle}>Choose your currency and monthly baseline. We scale it for longer calendar ranges automatically.</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Monthly budget</Text>
        <View style={styles.inputRow}>
          <Pressable accessibilityRole="button" onPress={onOpenCurrencyPicker} style={({ pressed }) => [styles.currencyChip, pressed && styles.pressed]}>
            <Text style={styles.currencyFlag}>{currency.flagEmoji}</Text>
            <Text style={styles.currencyCode}>{currency.code}</Text>
            <ChevronDown color={colors.textMuted} size={16} strokeWidth={2.5} />
          </Pressable>
          <TextInput
            keyboardType="decimal-pad"
            placeholder="1200"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            selectionColor={colors.primary}
            style={styles.input}
            value={budget}
            onChangeText={onChangeBudget}
          />
        </View>
        <Text style={styles.helper}>This can be changed anytime from Settings → Profile.</Text>
      </View>
    </>
  );
}

function FinishStep({ name }: { name: string }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const displayName = name.trim() || 'there';
  return (
    <>
      <View style={styles.heroIconWrap}>
        <View style={styles.heroIcon}>
          <CategoryIcon categoryId="food" size={54} />
        </View>
        <View style={styles.floatingIconPrimary}>
          <PartyPopper color={colors.primary} size={21} strokeWidth={2.5} />
        </View>
      </View>
      <Text style={styles.eyebrow}>All set</Text>
      <Text style={styles.title}>Awesome, {displayName}. Let’s start tracking!</Text>
      <Text style={styles.subtitle}>Your dashboard is ready. Add your first expense and watch your spending update by month, range, or year.</Text>
      <View style={styles.readyCard}>
        <CheckCircle2 color={colors.income} size={20} strokeWidth={2.5} />
        <Text style={styles.readyText}>Profile saved locally on this device after you continue.</Text>
        <ArrowRight color={colors.textMuted} size={18} strokeWidth={2.5} />
      </View>
    </>
  );
}

function CurrencyPickerModal({ selectedCode, visible, onClose, onSelect }: { selectedCode: string; visible: boolean; onClose: () => void; onSelect: (code: string) => void }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const currencies = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const options = getCurrencyOptions();
    if (!normalized) return options.slice(0, 80);
    return options.filter((currency) => `${currency.code} ${currency.name} ${currency.symbol}`.toLowerCase().includes(normalized)).slice(0, 80);
  }, [query]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close currency picker" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.currencySheet}>
          <View style={styles.currencySheetHeader}>
            <View>
              <Text style={styles.currencySheetTitle}>Choose currency</Text>
              <Text style={styles.currencySheetSubtitle}>Used for your budget and expenses.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <X color={colors.text} size={20} strokeWidth={2.6} />
            </Pressable>
          </View>
          <View style={styles.searchRow}>
            <Search color={colors.textMuted} size={18} strokeWidth={2.4} />
            <TextInput
              placeholder="Search currency"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <FlatList
            data={currencies}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable onPress={() => onSelect(item.code)} style={({ pressed }) => [styles.currencyRow, pressed && styles.pressed]}>
                <Text style={styles.currencyFlag}>{item.flagEmoji}</Text>
                <View style={styles.currencyRowText}>
                  <Text style={styles.currencyRowCode}>{item.code} · {item.symbol}</Text>
                  <Text style={styles.currencyRowName}>{item.name}</Text>
                </View>
                {item.code === selectedCode ? <CheckCircle2 color={colors.primary} size={20} strokeWidth={2.5} /> : null}
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

function FeaturePill({ icon, label }: { icon: ReactNode; label: string }) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.featurePill}>
      {icon}
      <Text style={styles.featurePillText}>{label}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme'], bottomInset = 0, topInset = 0) {
  const { colors, spacing } = theme;
  const bottomLift = Math.max(16, bottomInset + 12);
  const topLift = Math.max(spacing.screen, topInset + 12);
  return StyleSheet.create({
    keyboardRoot: { backgroundColor: colors.background, flex: 1 },
    pageShell: { backgroundColor: colors.background, flex: 1, gap: theme.isCompact ? spacing.md : spacing.lg, paddingHorizontal: spacing.screen, paddingTop: topLift },
    topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    backButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, height: 38, justifyContent: 'center', width: 38 },
    backButtonHidden: { opacity: 0 },
    pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
    stepCount: { color: colors.textMuted, fontSize: 12, fontWeight: '900', textAlign: 'right' },
    stepScroll: { flex: 1 },
    stepScrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: theme.isCompact ? 8 : 16 },
    stepCard: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: 'transparent', borderColor: 'transparent', borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, gap: theme.isCompact ? 10 : 12, justifyContent: 'center', padding: theme.isCompact ? spacing.md : spacing.card + 4 },
    progressTrack: { alignItems: 'center', flexDirection: 'row', gap: 7, justifyContent: 'center' },
    progressDot: { backgroundColor: colors.surfaceMuted, borderRadius: 999, height: 8, width: 8 },
    progressDotActive: { backgroundColor: colors.primarySoftBorder },
    progressDotCurrent: { backgroundColor: colors.primary, width: 28 },
    heroIconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    heroIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder, borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, height: 86, justifyContent: 'center', width: 86 },
    logoHeroIcon: { alignItems: 'center', backgroundColor: 'transparent', borderColor: 'transparent', borderRadius: 34, borderWidth: StyleSheet.hairlineWidth, height: 124, justifyContent: 'center', overflow: 'visible', width: 124 },
    logoImage: { height: 116, resizeMode: 'contain', width: 116 },
    floatingIconPrimary: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, bottom: -3, height: 34, justifyContent: 'center', position: 'absolute', right: -8, width: 34 },
    smallIconBubble: { alignItems: 'center', backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, height: 66, justifyContent: 'center', marginBottom: 4, width: 66 },
    eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textAlign: 'center', textTransform: 'uppercase' },
    title: { color: colors.text, fontSize: theme.isCompact ? 28 : 32, fontWeight: '900', letterSpacing: -0.8, lineHeight: theme.isCompact ? 32 : 36, textAlign: 'center' },
    subtitle: { color: colors.textMuted, fontSize: 15, fontWeight: '600', lineHeight: 22, maxWidth: 330, textAlign: 'center' },
    featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
    featurePill: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 6, paddingHorizontal: 11, paddingVertical: 8 },
    featurePillText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
    fieldGroup: { alignSelf: 'stretch', gap: 8, marginTop: 8 },
    label: { color: colors.text, fontSize: 14, fontWeight: '800', textAlign: 'center' },
    inputRow: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.input, borderColor: colors.border, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingVertical: 4 },
    input: { color: colors.text, flex: 1, fontSize: 16, minHeight: 48, paddingVertical: 8 },
    currencyChip: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 8 },
    currencyFlag: { fontSize: 18 },
    currencyCode: { color: colors.text, fontSize: 13, fontWeight: '900' },
    helper: { color: colors.textMuted, fontSize: 12, fontWeight: '600', lineHeight: 18, textAlign: 'center' },
    readyCard: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 9, marginTop: 4, padding: 13 },
    readyText: { color: colors.textSecondary, flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },
    bottomControls: { gap: theme.isCompact ? 8 : 12, paddingBottom: bottomLift },
    microcopy: { color: colors.textMuted, fontSize: 12, fontWeight: '600', lineHeight: 18, textAlign: 'center' },
    modalRoot: { backgroundColor: colors.overlay, flex: 1, justifyContent: 'flex-end' },
    currencySheet: { backgroundColor: colors.sheet, borderTopLeftRadius: 26, borderTopRightRadius: 26, gap: 12, maxHeight: '78%', padding: spacing.card },
    currencySheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    currencySheetTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
    currencySheetSubtitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: 2 },
    closeButton: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 999, height: 36, justifyContent: 'center', width: 36 },
    searchRow: { alignItems: 'center', backgroundColor: colors.input, borderColor: colors.border, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
    searchInput: { color: colors.text, flex: 1, fontSize: 15, minHeight: 44 },
    currencyRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, minHeight: 58, paddingVertical: 9 },
    currencyRowText: { flex: 1, gap: 2 },
    currencyRowCode: { color: colors.text, fontSize: 15, fontWeight: '900' },
    currencyRowName: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  });
}
