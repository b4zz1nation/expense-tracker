import { MaterialCommunityIcons } from '@expo/vector-icons';
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

type CurrencyOption = ReturnType<typeof getCurrencyOptions>[number];

export default function SettingsScreen() {
  const currencySheetRef = useRef<BottomSheetModal>(null);
  const [storedCurrencyCode, setStoredCurrencyCode] = useState<string | null>(null);
  const [loadingCurrency, setLoadingCurrency] = useState(true);
  const [savingCurrency, setSavingCurrency] = useState(false);
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
        <MaterialCommunityIcons
          color={selected ? '#2563EB' : '#94A3B8'}
          name={selected ? 'check-circle' : 'chevron-right'}
          size={22}
        />
      </Pressable>
    );
  }, [chooseCurrency, selectedCurrencyCode]);

  return (
    <Screen>
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
            opacity={0.42}
            pressBehavior="close"
          />
        )}
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
                <MaterialCommunityIcons color="#94A3B8" name="magnify" size={20} />
                <BottomSheetTextInput
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="Search by code, name, or symbol"
                  placeholderTextColor="#94A3B8"
                  selectionColor="#2563EB"
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

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 10 },
  sectionLabel: { color: '#64748B', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  currencySummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  currencySummaryBadge: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  currencySummarySymbol: { color: '#2563EB', fontSize: 24, fontWeight: '800' },
  currencySummaryText: { flex: 1, gap: 3 },
  title: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#334155', fontSize: 15, fontWeight: '600' },
  helperText: { color: '#64748B', lineHeight: 20 },
  text: { color: '#64748B', lineHeight: 20 },
  resetButton: { alignSelf: 'flex-start' },
  resetButtonText: { color: '#2563EB', fontWeight: '700' },
  sheetHeader: { backgroundColor: '#F8FAFC', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  sheetTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800' },
  sheetSubtitle: { color: '#64748B', lineHeight: 20 },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { color: '#0F172A', flex: 1, fontSize: 16, padding: 0 },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  sheetActionButton: { paddingHorizontal: 2, paddingVertical: 2 },
  sheetActionButtonText: { color: '#2563EB', fontWeight: '700' },
  listContent: { paddingHorizontal: 20, paddingBottom: 28, gap: 10 },
  currencyList: { flex: 1 },
  currencyRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  currencyRowSelected: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  currencyRowPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  currencyRowLeft: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10 },
  currencyFlag: { fontSize: 18, lineHeight: 18 },
  currencyRowText: { flex: 1, gap: 1 },
  currencyRowTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 28 },
  emptyStateTitle: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
  emptyStateText: { color: '#64748B', marginTop: 4 },
  savingOverlay: { bottom: 20, left: 0, position: 'absolute', right: 0, alignItems: 'center' },
  savingPill: { backgroundColor: '#0F172A', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  savingPillText: { color: '#FFFFFF', fontWeight: '700' },
});
