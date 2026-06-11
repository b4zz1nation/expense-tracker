import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Calendar from 'react-native-calendars/src/calendar';
import type { DateData } from 'react-native-calendars/src/types';
import {
  createDefaultDateFilter,
  createTodayDateFilter,
  dateFilterHelper,
  dateFilterLabel,
  dateFilterToRange,
  normalizeRange,
  selectedDayForDateFilter,
  shiftDateFilter,
  yearsAround,
  type DateFilter,
  type DateFilterMode,
} from '../lib/dateFilter';
import { todayDateString } from '../lib/dates';
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
  { mode: 'day', label: 'Day' },
  { mode: 'month', label: 'Month' },
  { mode: 'range', label: 'Range' },
  { mode: 'year', label: 'Yearly' },
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function DateFilterSelector({ value, onChange }: Props) {
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateFilter>(value);

  const range = dateFilterToRange(draft);
  const selectedMonthYear = draft.mode === 'month' ? Number(draft.month.slice(0, 4)) : Number(range.startDate.slice(0, 4));
  const visibleMonth = range.startDate;

  const markedDates = useMemo(() => buildMarkedDates(draft, colors.primary, colors.primarySoft, colors.onPrimary), [colors.onPrimary, colors.primary, colors.primarySoft, draft]);
  const yearOptions = useMemo(() => yearsAround(new Date(), 6), []);

  const openPicker = () => {
    setDraft(value);
    setOpen(true);
  };

  const closePicker = () => setOpen(false);

  const applyDraft = () => {
    onChange(draft);
    setOpen(false);
  };

  const switchMode = (mode: DateFilterMode) => {
    if (mode === draft.mode) return;
    const selectedDay = selectedDayForDateFilter(draft);
    if (mode === 'day') {
      setDraft(createTodayDateFilter());
      return;
    }
    if (mode === 'month') {
      setDraft({ mode: 'month', month: selectedDay.slice(0, 7) });
      return;
    }
    if (mode === 'range') {
      setDraft({ mode: 'range', startDate: selectedDay, endDate: selectedDay });
      return;
    }
    setDraft({ mode: 'year', year: Number(selectedDay.slice(0, 4)) });
  };

  const handleDayPress = (day: DateData) => {
    const dateString = day.dateString;
    if (draft.mode === 'day') {
      setDraft({ mode: 'day', date: dateString });
      return;
    }
    if (draft.mode === 'range') {
      const range = dateFilterToRange(draft);
      const nextRange = dateString < range.startDate || range.startDate !== range.endDate
        ? { startDate: dateString, endDate: dateString }
        : normalizeRange(range.startDate, dateString);
      setDraft({ mode: 'range', ...nextRange });
    }
  };

  const nudge = (delta: number) => onChange(shiftDateFilter(value, delta));
  const showsCalendar = draft.mode === 'day' || draft.mode === 'range';

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
                <Text style={styles.subtitle}>Day, month, custom range, or yearly view</Text>
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

            {draft.mode === 'month' ? (
              <View style={styles.monthPicker}>
                <View style={styles.pickerHeader}>
                  <Pressable accessibilityLabel="Previous year" accessibilityRole="button" onPress={() => setDraft({ mode: 'month', month: `${selectedMonthYear - 1}-${draft.month.slice(5, 7)}` })} style={styles.pickerArrow}>
                    <ChevronLeft color={colors.primary} size={22} strokeWidth={2.6} />
                  </Pressable>
                  <Text style={styles.pickerTitle}>{selectedMonthYear}</Text>
                  <Pressable accessibilityLabel="Next year" accessibilityRole="button" onPress={() => setDraft({ mode: 'month', month: `${selectedMonthYear + 1}-${draft.month.slice(5, 7)}` })} style={styles.pickerArrow}>
                    <ChevronRight color={colors.primary} size={22} strokeWidth={2.6} />
                  </Pressable>
                </View>
                <View style={styles.monthGrid}>
                  {MONTHS.map((monthName, index) => {
                    const monthValue = `${selectedMonthYear}-${String(index + 1).padStart(2, '0')}`;
                    const selected = draft.mode === 'month' && draft.month === monthValue;
                    return (
                      <Pressable key={monthValue} onPress={() => setDraft({ mode: 'month', month: monthValue })} style={[styles.monthButton, selected && styles.monthButtonSelected]}>
                        <Text style={[styles.monthText, selected && styles.monthTextSelected]}>{monthName.slice(0, 3)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : draft.mode === 'year' ? (
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
            ) : showsCalendar ? (
              <Calendar
                current={visibleMonth}
                markingType={draft.mode === 'day' ? undefined : 'period'}
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
            ) : null}

            <View style={styles.actions}>
              <Pressable onPress={() => setDraft(draft.mode === 'day' ? createTodayDateFilter() : createDefaultDateFilter())} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>Today</Text>
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

  if (filter.mode === 'day') {
    markings[filter.date] = { selected: true, selectedColor: primary, selectedTextColor: onPrimary };
    return markings;
  }

  if (filter.mode === 'month') {
    const selectedDate = `${filter.month}-01`;
    markings[selectedDate] = { selected: true, selectedColor: primary, selectedTextColor: onPrimary };
    return markings;
  }

  if (filter.mode === 'year') return markings;

  const range = dateFilterToRange(filter);
  if (range.startDate === range.endDate) {
    markings[range.startDate] = { selected: true, selectedColor: primary, selectedTextColor: onPrimary, startingDay: true, endingDay: true, color: primary, textColor: onPrimary };
    return markings;
  }

  const start = parseDate(range.startDate);
  const end = parseDate(range.endDate);
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = todayDateString(cursor);
    const isStart = date === range.startDate;
    const isEnd = date === range.endDate;
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
    subtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 2, maxWidth: 270 },
    closeButton: { alignItems: 'center', borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
    modeRow: { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 3, padding: 3 },
    modeButton: { alignItems: 'center', borderRadius: 11, flex: 1, paddingHorizontal: 3, paddingVertical: 8 },
    modeButtonSelected: { backgroundColor: colors.primarySoft },
    modeText: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
    modeTextSelected: { color: colors.primary },
    currentSelection: { color: colors.text, fontSize: 15, fontWeight: '800' },
    calendar: { borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    monthPicker: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, gap: 12, padding: 12 },
    pickerHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    pickerArrow: { alignItems: 'center', borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
    pickerTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    monthButton: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, minWidth: '30%', paddingHorizontal: 12, paddingVertical: 14 },
    monthButtonSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder },
    monthText: { color: colors.text, fontSize: 15, fontWeight: '800' },
    monthTextSelected: { color: colors.primary },
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
