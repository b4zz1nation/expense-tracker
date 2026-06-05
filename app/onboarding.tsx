import { router } from 'expo-router';
import { ArrowRight, CheckCircle2, ChevronLeft, PartyPopper, PiggyBank, Sparkles, UserRound, WalletCards } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Animated, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../src/components/AppButton';
import { CategoryIcon } from '../src/components/CategoryIcon';
import { Screen } from '../src/components/Screen';
import { saveUserProfile } from '../src/db/settingsRepo';
import { parseMoneyToCents } from '../src/lib/currency';
import { useAppTheme } from '../src/theme/ThemeContext';

const TOTAL_STEPS = 4;

type Step = 0 | 1 | 2 | 3;

export default function OnboardingScreen() {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const transition = useRef(new Animated.Value(1)).current;

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
    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1) as Step);
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
        <View style={styles.progressTrack}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View key={index} style={[styles.progressDot, index <= step && styles.progressDotActive, index === step && styles.progressDotCurrent]} />
          ))}
        </View>
        <Text style={styles.stepCount}>{step + 1}/{TOTAL_STEPS}</Text>
      </View>

      <Animated.View style={[styles.stepCard, animatedStyle]}>
        {step === 0 ? <WelcomeStep /> : null}
        {step === 1 ? <NameStep name={name} onChangeName={setName} /> : null}
        {step === 2 ? <BudgetStep budget={budget} onChangeBudget={setBudget} /> : null}
        {step === 3 ? <FinishStep name={name} /> : null}
      </Animated.View>

      <View style={styles.actionCard}>
        <AppButton disabled={saving} onPress={step === 3 ? finish : goNext}>
          {step === 3 ? (saving ? 'Saving…' : "Let's start tracking") : 'Continue'}
        </AppButton>
        {step < 3 ? (
          <Text style={styles.microcopy}>You can update these details later from Settings → Profile.</Text>
        ) : null}
      </View>
    </Screen>
  );
}

function WelcomeStep() {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <View style={styles.heroIconWrap}>
        <View style={styles.heroIcon}>
          <CategoryIcon categoryId="bills" size={54} />
        </View>
        <View style={styles.floatingIconPrimary}>
          <Sparkles color={colors.primary} size={20} strokeWidth={2.6} />
        </View>
      </View>
      <Text style={styles.eyebrow}>Expense Tracker</Text>
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
            autoFocus
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

function BudgetStep({ budget, onChangeBudget }: { budget: string; onChangeBudget: (value: string) => void }) {
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
      <Text style={styles.subtitle}>We use this as your baseline. Month view shows it once, 6-month spans multiply it by 6, and yearly view multiplies it by 12.</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Monthly budget</Text>
        <View style={styles.inputRow}>
          <PiggyBank color={colors.textMuted} size={20} strokeWidth={2.4} />
          <TextInput
            autoFocus
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

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    topBar: { alignItems: 'center', flexDirection: 'row', gap: 12 },
    backButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, height: 38, justifyContent: 'center', width: 38 },
    backButtonHidden: { opacity: 0 },
    pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
    progressTrack: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center' },
    progressDot: { backgroundColor: colors.surfaceMuted, borderRadius: 999, height: 8, width: 8 },
    progressDotActive: { backgroundColor: colors.primarySoftBorder },
    progressDotCurrent: { backgroundColor: colors.primary, width: 28 },
    stepCount: { color: colors.textMuted, fontSize: 12, fontWeight: '900', minWidth: 34, textAlign: 'right' },
    stepCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, gap: 12, overflow: 'hidden', padding: spacing.card + 4 },
    heroIconWrap: { alignItems: 'center', alignSelf: 'flex-start', justifyContent: 'center', marginBottom: 6 },
    heroIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder, borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, height: 86, justifyContent: 'center', width: 86 },
    floatingIconPrimary: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, bottom: -3, height: 34, justifyContent: 'center', position: 'absolute', right: -8, width: 34 },
    smallIconBubble: { alignItems: 'center', backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, height: 66, justifyContent: 'center', marginBottom: 4, width: 66 },
    eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
    title: { color: colors.text, fontSize: theme.isCompact ? 28 : 32, fontWeight: '900', letterSpacing: -0.8, lineHeight: theme.isCompact ? 32 : 36 },
    subtitle: { color: colors.textMuted, fontSize: 15, fontWeight: '600', lineHeight: 22 },
    featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    featurePill: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 6, paddingHorizontal: 11, paddingVertical: 8 },
    featurePillText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
    fieldGroup: { gap: 8, marginTop: 8 },
    label: { color: colors.text, fontSize: 14, fontWeight: '800' },
    inputRow: { alignItems: 'center', backgroundColor: colors.input, borderColor: colors.border, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 4 },
    input: { color: colors.text, flex: 1, fontSize: 16, minHeight: 48, paddingVertical: 8 },
    helper: { color: colors.textMuted, fontSize: 12, fontWeight: '600', lineHeight: 18 },
    readyCard: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 9, marginTop: 4, padding: 13 },
    readyText: { color: colors.textSecondary, flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },
    actionCard: { gap: 10 },
    microcopy: { color: colors.textMuted, fontSize: 12, fontWeight: '600', lineHeight: 18, textAlign: 'center' },
  });
}
