import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Calendar from 'react-native-calendars/src/calendar';
import type { DateData } from 'react-native-calendars/src/types';
import {
  clampRangeToOneYear,
  createDefaultDateFilter,
  dateFilterHelper,
  dateFilterLabel,
  dateFilterToRange,
  isRangeWithinOneYear,
  shiftDateFilter,
  yearsAround,
  type DateFilter,
  type DateFilterMode,
} from '../lib/dateFilter';
import { currentMonthString, todayDateString } from '../lib/dates';
import { useAppTheme } from '../theme/ThemeContext';

type Props = {
  value: DateFilter;
  onChange: (value: DateFilter) => void;
};

type Marking = {
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
  startingDay?: boolean;
  endingDay?: boolean;
  color?: string;
  textColor?: string;
};

const MODES: Array<{ mode: DateFilterMode; label: string }> = [
  { mode: 'month', label: 'Month' },
  { mode: 'range', label: 'Range' },
  { mode: 'year', label: 'Year' },
];

export function DateFilterSelector({ value, onChange }: Props) {
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateFilter>(value);
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(value.mode === 'range' ? value.startDate : null);
  const [rangeMessage, setRangeMessage] = useState<string | null>(null);

  const range = dateFilterToRange(draft);
  const visibleMonth = draft.mode === 'month' ? `${draft.month}-01` : range.startDate;

  const markedDates = useMemo(() => buildMarkedDates(draft, colors.primary, colors.primarySoft, colors.onPrimary), [colors.onPrimary, colors.primary, colors.primarySoft, draft]);
  const yearOptions = useMemo(() => yearsAround(new Date(), 6), []);

  const openPicker = () => {
    setDraft(value);
    setRangeAnchor(value.mode === 'range' ? value.startDate : null);
    setRangeMessage(null);
    setOpen(true);
  };

  const closePicker = () => setOpen(false);

  const applyDraft = () => {
    onChange(draft);
    setOpen(false);
  };

  const switchMode = (mode: DateFilterMode) => {
    setRangeMessage(null);
    if (mode === draft.mode) return;
    const currentRange = dateFilterToRange(draft);
    if (mode === 'month') {
      setDraft({ mode: 'month', month: currentRange.startDate.slice(0, 7) });
      return;
    }
    if (mode === 'year') {
      setDraft({ mode: 'year', year: Number(currentRange.startDate.slice(0, 4)) });
      return;
    }
    const nextRange = clampRangeToOneYear(currentRange.startDate, currentRange.endDate);
    setDraft({ mode: 'range', ...nextRange });
    setRangeAnchor(nextRange.startDate);
  };

  const handleDayPress = (day: DateData) => {
    const dateString = day.dateString;
    setRangeMessage(null);

    if (draft.mode === 'month') {
      setDraft({ mode: 'month', month: dateString.slice(0, 7) });
      return;
    }

    if (draft.mode === 'year') {
      setDraft({ mode: 'year', year: Number(dateString.slice(0, 4)) });
      return;
    }

    if (!rangeAnchor || (draft.startDate && draft.endDate && rangeAnchor !== draft.startDate)) {
      setRangeAnchor(dateString);
      setDraft({ mode: 'range', startDate: dateString, endDate: dateString });
      return;
    }

    if (!isRangeWithinOneYear(rangeAnchor, dateString)) {
      const clamped = clampRangeToOneYear(rangeAnchor, dateString);
      setDraft({ mode: 'range', ...clamped });
      setRangeAnchor(null);
      setRangeMessage('Range limited to 1 year.');
      return;
    }

    const nextRange = clampRangeToOneYear(rangeAnchor, dateString);
    setDraft({ mode: 'range', ...nextRange });
    setRangeAnchor(null);
  };

  const nudge = (delta: number) => onChange(shiftDateFilter(value, delta));

  return (
    <>
      <View style={styles.selectorRow}>
        <Pressable accessibilityLabel="Previous date range" accessibilityRole="button" onPress={() => nudge(-1)} style={styles.arrowButton}>
          <ChevronLeft color={colors.primary} size={24} strokeWidth={2.6} />
        </Pressable>
        <Pressable accessibilityLabel="Open date selector" accessibilityRole="button" onPress={openPicker} style={styles.selectorButton}>
          <View style={styles.selectorIcon}>
            <CalendarDays color={colors.primary} size={18} strokeWidth={2.5} />
          </View>
          <View style={styles.selectorTextBlock}>
            <Text style={styles.selectorHelper}>{dateFilterHelper(value)}</Text>
            <Text style={styles.selectorLabel} numberOfLines={1}>{dateFilterLabel(value)}</Text>
          </View>
          <ChevronDown color={colors.textMuted} size={18} strokeWidth={2.5} />
        </Pressable>
        <Pressable accessibilityLabel="Next date range" accessibilityRole="button" onPress={() => nudge(1)} style={styles.arrowButton}>
          <ChevronRight color={colors.primary} size={24} strokeWidth={2.6} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={closePicker}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePicker} />
          <View style={styles.card}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Select date</Text>
                <Text style={styles.subtitle}>Month, up to 1-year range, or whole year</Text>
              </View>
              <Pressable accessibilityLabel="Close date selector" accessibilityRole="button" onPress={closePicker} style={styles.closeButton}>
                <X color={colors.textMuted} size={20} strokeWidth={2.6} />
              </Pressable>
            </View>

            <View style={styles.modeRow}>
              {MODES.map((option) => {
                const selected = draft.mode === option.mode;
                return (
                  <Pressable key={option.mode} onPress={() => switchMode(option.mode)} style={[styles.modeButton, selected && styles.modeButtonSelected]}>
                    <Text style={[styles.modeText, selected && styles.modeTextSelected]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.currentSelection}>{dateFilterLabel(draft)}</Text>
            {rangeMessage ? <Text style={styles.rangeMessage}>{rangeMessage}</Text> : null}

            {draft.mode === 'year' ? (
              <ScrollView contentContainerStyle={styles.yearGrid} showsVerticalScrollIndicator={false} bounces alwaysBounceVertical overScrollMode="always">
                {yearOptions.map((year) => {
                  const selected = draft.mode === 'year' && draft.year === year;
                  return (
                    <Pressable key={year} onPress={() => setDraft({ mode: 'year', year })} style={[styles.yearButton, selected && styles.yearButtonSelected]}>
                      <Text style={[styles.yearText, selected && styles.yearTextSelected]}>{year}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Calendar
                current={visibleMonth}
                maxDate={draft.mode === 'range' && rangeAnchor ? clampRangeToOneYear(rangeAnchor, '9999-12-31').endDate : undefined}
                markingType={draft.mode === 'range' ? 'period' : undefined}
                markedDates={markedDates}
                onDayPress={handleDayPress}
                enableSwipeMonths
                hideExtraDays
                firstDay={1}
                theme={{
                  calendarBackground: colors.surface,
                  textSectionTitleColor: colors.textMuted,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: colors.onPrimary,
                  todayTextColor: colors.primary,
                  dayTextColor: colors.text,
                  textDisabledColor: colors.disabled,
                  monthTextColor: colors.text,
                  arrowColor: colors.primary,
                  textDayFontWeight: '600',
                  textMonthFontWeight: '800',
                  textDayHeaderFontWeight: '800',
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 11,
                }}
                style={styles.calendar}
              />
            )}

            <View style={styles.actions}>
              <Pressable onPress={() => setDraft(createDefaultDateFilter())} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>This month</Text>
              </Pressable>
              <Pressable onPress={applyDraft} style={styles.primaryAction}>
                <Text style={styles.primaryActionText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function buildMarkedDates(filter: DateFilter, primary: string, soft: string, onPrimary: string): Record<string, Marking> {
  const today = todayDateString();
  const markings: Record<string, Marking> = {
    [today]: { selectedColor: primary },
  };

  if (filter.mode === 'month') {
    const selectedDate = `${filter.month}-01`;
    markings[selectedDate] = { selected: true, selectedColor: primary, selectedTextColor: onPrimary };
    return markings;
  }

  if (filter.mode === 'year') return markings;

  if (filter.startDate === filter.endDate) {
    markings[filter.startDate] = { selected: true, selectedColor: primary, selectedTextColor: onPrimary, startingDay: true, endingDay: true, color: primary, textColor: onPrimary };
    return markings;
  }

  const start = parseDate(filter.startDate);
  const end = parseDate(filter.endDate);
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = todayDateString(cursor);
    const isStart = date === filter.startDate;
    const isEnd = date === filter.endDate;
    markings[date] = {
      startingDay: isStart,
      endingDay: isEnd,
      color: isStart || isEnd ? primary : soft,
      textColor: isStart || isEnd ? onPrimary : primary,
    };
  }
  return markings;
}

function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    selectorRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    arrowButton: { alignItems: 'center', borderRadius: 999, height: 40, justifyContent: 'center', width: 40 },
    selectorButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flex: 1, flexDirection: 'row', gap: 10, minHeight: 58, paddingHorizontal: 12, paddingVertical: 9 },
    selectorIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
    selectorTextBlock: { flex: 1, gap: 1, minWidth: 0 },
    selectorHelper: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
    selectorLabel: { color: colors.text, fontSize: 16, fontWeight: '900' },
    overlay: { alignItems: 'center', backgroundColor: colors.overlay, flex: 1, justifyContent: 'center', padding: spacing.screen },
    card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, gap: 12, maxHeight: '88%', padding: spacing.card, width: '100%' },
    header: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
    title: { color: colors.text, fontSize: 20, fontWeight: '900' },
    subtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 2 },
    closeButton: { alignItems: 'center', borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
    modeRow: { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 3, padding: 3 },
    modeButton: { alignItems: 'center', borderRadius: 11, flex: 1, paddingVertical: 8 },
    modeButtonSelected: { backgroundColor: colors.primarySoft },
    modeText: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
    modeTextSelected: { color: colors.primary },
    currentSelection: { color: colors.text, fontSize: 15, fontWeight: '800' },
    rangeMessage: { color: colors.warning, fontSize: 12, fontWeight: '700' },
    calendar: { borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },
    yearButton: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, minWidth: '30%', paddingHorizontal: 12, paddingVertical: 12 },
    yearButtonSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder },
    yearText: { color: colors.text, fontSize: 16, fontWeight: '800' },
    yearTextSelected: { color: colors.primary },
    actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
    secondaryAction: { borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10 },
    secondaryActionText: { color: colors.textSecondary, fontWeight: '800' },
    primaryAction: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
    primaryActionText: { color: colors.onPrimary, fontWeight: '900' },
  });
}
