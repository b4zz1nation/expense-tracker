import { CheckCircle, ChevronRight, MonitorCog, Moon, Search, Sun, type LucideIcon } from 'lucide-react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../src/components/AppButton';
import { Screen } from '../../src/components/Screen';
import { clearExpenses } from '../../src/db/expensesRepo';
import {
  getCurrencyDisplayName,
  getCurrencyOption,
  getCurrencyOptions,
  getDeviceDefaultCurrencyCode,
} from '../../src/lib/currencies';
import {
  getPreferredCurrencySetting,
  resetPreferredCurrencyCode,
  setPreferredCurrencyCode,
} from '../../src/db/settingsRepo';
import { useAppTheme } from '../../src/theme/ThemeContext';
import type { ThemeMode } from '../../src/theme/theme';

type CurrencyOption = ReturnType<typeof getCurrencyOptions>[number];

const THEME_OPTIONS: Array<{ mode: ThemeMode; title: string; Icon: LucideIcon }> = [
  { mode: 'system', title: 'System', Icon: MonitorCog },
  { mode: 'light', title: 'Light', Icon: Sun },
  { mode: 'dark', title: 'Dark', Icon: Moon },
];

export default function SettingsScreen() {
  const currencySheetRef = useRef<BottomSheetModal>(null);
  const { theme, mode, setMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const [storedCurrencyCode, setStoredCurrencyCode] = useState<string | null>(null);
  const [loadingCurrency, setLoadingCurrency] = useState(true);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingThemeMode, setSavingThemeMode] = useState<ThemeMode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(getDeviceDefaultCurrencyCode());

  const deviceDefaultCurrencyCode = useMemo(() => getDeviceDefaultCurrencyCode(), []);
  const currentCurrencyCode = storedCurrencyCode ?? deviceDefaultCurrencyCode;
  const currentCurrency = getCurrencyOption(currentCurrencyCode) ?? getCurrencyOption(deviceDefaultCurrencyCode) ?? getCurrencyOptions()[0];
  const deviceDefaultCurrency = getCurrencyOption(deviceDefaultCurrencyCode) ?? currentCurrency;
  const isUsingOverride = storedCurrencyCode !== null;

  useEffect(() => {
    void (async () => {
      const stored = await getPreferredCurrencySetting();
      setStoredCurrencyCode(stored?.trim().toUpperCase() ?? null);
      setSelectedCurrencyCode((stored ?? deviceDefaultCurrencyCode).trim().toUpperCase());
      setLoadingCurrency(false);
    })();
  }, [deviceDefaultCurrencyCode]);

  const currencyOptions = useMemo(() => getCurrencyOptions(), []);
  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const ordered = [...currencyOptions].sort((left, right) => {
      if (left.code === selectedCurrencyCode) return -1;
      if (right.code === selectedCurrencyCode) return 1;
      return left.name.localeCompare(right.name) || left.code.localeCompare(right.code);
    });

    if (!query) return ordered;

    return ordered.filter((entry) => {
      return [entry.code, entry.name, entry.symbol].some((value) => value.toLowerCase().includes(query));
    });
  }, [currencyOptions, searchQuery, selectedCurrencyCode]);

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

  const chooseThemeMode = useCallback(async (nextMode: ThemeMode) => {
    setSavingThemeMode(nextMode);
    try {
      await setMode(nextMode);
    } catch (error) {
      Alert.alert('Could not save appearance', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingThemeMode(null);
    }
  }, [setMode]);

  const openCurrencyPicker = useCallback(() => {
    setSearchQuery('');
    currencySheetRef.current?.present();
  }, []);

  const closeCurrencyPicker = useCallback(() => {
    currencySheetRef.current?.dismiss();
  }, []);

  const chooseCurrency = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    setSavingCurrency(true);
    try {
      await setPreferredCurrencyCode(normalized);
      setStoredCurrencyCode(normalized);
      setSelectedCurrencyCode(normalized);
      closeCurrencyPicker();
    } catch (error) {
      Alert.alert('Could not save currency', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingCurrency(false);
    }
  }, [closeCurrencyPicker]);

  const resetToDeviceDefault = useCallback(async () => {
    setSavingCurrency(true);
    try {
      await resetPreferredCurrencyCode();
      setStoredCurrencyCode(null);
      setSelectedCurrencyCode(deviceDefaultCurrencyCode);
      closeCurrencyPicker();
    } catch (error) {
      Alert.alert('Could not reset currency', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingCurrency(false);
    }
  }, [closeCurrencyPicker, deviceDefaultCurrencyCode]);

  const renderCurrencyRow = useCallback(({ item }: { item: CurrencyOption }) => {
    const selected = item.code === selectedCurrencyCode;
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => { void chooseCurrency(item.code); }}
        style={({ pressed }) => [
          styles.currencyRow,
          selected && styles.currencyRowSelected,
          pressed && styles.currencyRowPressed,
        ]}
      >
        <View style={styles.currencyRowLeft}>
          <Text style={styles.currencyFlag}>{item.flagEmoji}</Text>
          <View style={styles.currencyRowText}>
            <Text style={styles.currencyRowTitle} numberOfLines={1}>{item.code} · {item.name}</Text>
          </View>
        </View>
        {selected ? (
          <CheckCircle color={colors.primary} size={22} strokeWidth={2.4} />
        ) : (
          <ChevronRight color={colors.textMuted} size={22} strokeWidth={2.4} />
        )}
      </Pressable>
    );
  }, [chooseCurrency, colors.primary, colors.textMuted, selectedCurrencyCode, styles]);

  return (
    <Screen>
      <View style={[styles.card, styles.appearanceCard]}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.themeSegment}>
          {THEME_OPTIONS.map((option) => {
            const selected = mode === option.mode;
            return (
              <Pressable
                key={option.mode}
                accessibilityLabel={`Use ${option.title} appearance`}
                accessibilityRole="button"
                accessibilityState={{ selected, busy: savingThemeMode === option.mode }}
                disabled={savingThemeMode !== null}
                onPress={() => { void chooseThemeMode(option.mode); }}
                style={({ pressed }) => [
                  styles.themeSegmentOption,
                  selected && styles.themeSegmentOptionSelected,
                  pressed && styles.currencyRowPressed,
                ]}
              >
                <option.Icon color={selected ? colors.primary : colors.textMuted} size={16} strokeWidth={2.4} />
                <Text style={[styles.themeSegmentText, selected && styles.themeSegmentTextSelected]}>{option.title}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Currency</Text>
        <View style={styles.currencySummaryRow}>
          <View style={styles.currencySummaryBadge}>
            <Text style={styles.currencySummarySymbol}>{currentCurrency?.symbol ?? '$'}</Text>
          </View>
          <View style={styles.currencySummaryText}>
            <Text style={styles.title}>{currentCurrency?.code ?? currentCurrencyCode}</Text>
            <Text style={styles.subtitle}>{currentCurrency?.name ?? getCurrencyDisplayName(currentCurrencyCode)}</Text>
            <Text style={styles.helperText}>
              {loadingCurrency
                ? 'Checking your device locale…'
                : isUsingOverride
                  ? 'Saved on this device. Tap to change or reset to auto.'
                  : 'Auto-detected from your current country.'}
            </Text>
          </View>
        </View>
        <AppButton variant="secondary" onPress={openCurrencyPicker}>
          Choose Currency
        </AppButton>
        {isUsingOverride ? (
          <Pressable onPress={resetToDeviceDefault} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset to device default</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Storage</Text>
        <Text style={styles.text}>Local-first SQLite database. Expenses stay on this device.</Text>
      </View>

      <AppButton variant="danger" onPress={clear}>Clear All Expenses</AppButton>

      <BottomSheetModal
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={theme.isDark ? 0.62 : 0.42}
            pressBehavior="close"
          />
        )}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandleIndicator}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        enablePanDownToClose
        index={0}
        onDismiss={() => setSearchQuery('')}
        ref={currencySheetRef}
        snapPoints={['75%']}
      >
        <BottomSheetFlatList
          contentContainerStyle={styles.listContent}
          data={filteredCurrencies}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          overScrollMode="always"
          bounces
          alwaysBounceVertical
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No currencies found</Text>
              <Text style={styles.emptyStateText}>Try a different code or currency name.</Text>
            </View>
          )}
          ListHeaderComponent={(
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose currency</Text>
              <Text style={styles.sheetSubtitle}>
                Auto default: {deviceDefaultCurrency?.code ?? deviceDefaultCurrencyCode} · {deviceDefaultCurrency?.name ?? getCurrencyDisplayName(deviceDefaultCurrencyCode)}
              </Text>

              <View style={styles.searchBox}>
                <Search color={colors.textMuted} size={20} strokeWidth={2.4} />
                <BottomSheetTextInput
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="Search by code, name, or symbol"
                  placeholderTextColor={colors.textMuted}
                  selectionColor={colors.primary}
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View style={styles.sheetActions}>
                <Pressable onPress={resetToDeviceDefault} style={styles.sheetActionButton}>
                  <Text style={styles.sheetActionButtonText}>Reset to auto</Text>
                </Pressable>
              </View>
            </View>
          )}
          renderItem={renderCurrencyRow}
          style={styles.currencyList}
        />

        {savingCurrency ? (
          <View style={styles.savingOverlay} pointerEvents="none">
            <View style={styles.savingPill}>
              <Text style={styles.savingPillText}>Saving…</Text>
            </View>
          </View>
        ) : null}
      </BottomSheetModal>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: spacing.card, gap: spacing.md },
    appearanceCard: { gap: spacing.sm, paddingVertical: theme.isCompact ? 12 : 14 },
    sectionLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
    themeSegment: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 3, padding: 3 },
    themeSegmentOption: { alignItems: 'center', borderRadius: 11, flex: 1, flexDirection: 'row', gap: 5, justifyContent: 'center', minHeight: 34, paddingHorizontal: 6 },
    themeSegmentOptionSelected: { backgroundColor: colors.primarySoft },
    themeSegmentText: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
    themeSegmentTextSelected: { color: colors.primary },
    currencySummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    currencySummaryBadge: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 18, height: 56, justifyContent: 'center', width: 56 },
    currencySummarySymbol: { color: colors.primary, fontSize: 24, fontWeight: '800' },
    currencySummaryText: { flex: 1, gap: 3 },
    title: { color: colors.text, fontSize: 18, fontWeight: '800' },
    subtitle: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
    helperText: { color: colors.textMuted, lineHeight: 20 },
    text: { color: colors.textMuted, lineHeight: 20 },
    resetButton: { alignSelf: 'flex-start' },
    resetButtonText: { color: colors.primary, fontWeight: '700' },
    sheetBackground: { backgroundColor: colors.sheet },
    sheetHandleIndicator: { backgroundColor: colors.sheetHandle },
    sheetHeader: { backgroundColor: colors.sheet, gap: spacing.md, paddingHorizontal: spacing.screen, paddingTop: 8, paddingBottom: 14 },
    sheetTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
    sheetSubtitle: { color: colors.textMuted, lineHeight: 20 },
    searchBox: { alignItems: 'center', backgroundColor: colors.input, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
    searchInput: { color: colors.text, flex: 1, fontSize: 16, padding: 0 },
    sheetActions: { flexDirection: 'row', justifyContent: 'flex-end' },
    sheetActionButton: { paddingHorizontal: 2, paddingVertical: 2 },
    sheetActionButtonText: { color: colors.primary, fontWeight: '700' },
    listContent: { backgroundColor: colors.sheet, paddingHorizontal: spacing.screen, paddingBottom: 28, gap: 10 },
    currencyList: { backgroundColor: colors.sheet, flex: 1 },
    currencyRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8 },
    currencyRowSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder },
    currencyRowPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
    currencyRowLeft: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10 },
    currencyFlag: { fontSize: 18, lineHeight: 18 },
    currencyRowText: { flex: 1, gap: 1 },
    currencyRowTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingVertical: 28 },
    emptyStateTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
    emptyStateText: { color: colors.textMuted, marginTop: 4 },
    savingOverlay: { bottom: 20, left: 0, position: 'absolute', right: 0, alignItems: 'center' },
    savingPill: { backgroundColor: colors.text, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    savingPillText: { color: colors.background, fontWeight: '700' },
  });
}
