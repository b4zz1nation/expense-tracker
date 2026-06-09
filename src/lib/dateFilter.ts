import { currentMonthString, formatDateLabel, monthLabel, todayDateString } from './dates';

export type DateFilterMode = 'day' | 'month' | 'range90' | 'rangeYear' | 'year';

export type DateFilter =
  | { mode: 'day'; date: string }
  | { mode: 'month'; month: string }
  | { mode: 'range90'; startDate: string }
  | { mode: 'rangeYear'; startDate: string }
  | { mode: 'year'; year: number };

export type DateRange = {
  startDate: string;
  endDate: string;
};

export function createDefaultDateFilter(date = new Date()): DateFilter {
  return { mode: 'day', date: todayDateString(date) };
}

export function dateFilterToRange(filter: DateFilter): DateRange {
  if (filter.mode === 'day') {
    return { startDate: filter.date, endDate: filter.date };
  }

  if (filter.mode === 'month') {
    return {
      startDate: `${filter.month}-01`,
      endDate: addDays(nextMonthStart(filter.month), -1),
    };
  }

  if (filter.mode === 'range90') {
    return {
      startDate: filter.startDate,
      endDate: addDays(filter.startDate, 89),
    };
  }

  if (filter.mode === 'rangeYear') {
    return {
      startDate: filter.startDate,
      endDate: addDays(addYears(filter.startDate, 1), -1),
    };
  }

  return {
    startDate: `${filter.year}-01-01`,
    endDate: `${filter.year}-12-31`,
  };
}

export function dateFilterLabel(filter: DateFilter): string {
  if (filter.mode === 'day') return formatDateLabel(filter.date);
  if (filter.mode === 'month') return monthLabel(filter.month);
  if (filter.mode === 'year') return String(filter.year);

  const range = dateFilterToRange(filter);
  return `${formatDateLabel(range.startDate)} – ${formatDateLabel(range.endDate)}`;
}

export function dateFilterHelper(filter: DateFilter): string {
  if (filter.mode === 'day') return 'Day';
  if (filter.mode === 'month') return 'Month';
  if (filter.mode === 'range90') return '90-day span';
  if (filter.mode === 'rangeYear') return '1-year span';
  return 'Yearly';
}

export function dateFilterExpensesTitle(filter: DateFilter): string {
  if (filter.mode === 'day') return 'Day view expenses';
  if (filter.mode === 'month') return 'Month view expenses';
  if (filter.mode === 'range90') return '90-day view expenses';
  if (filter.mode === 'rangeYear') return '1-year view expenses';
  return 'Year view expenses';
}

export function dateFilterBudgetMultiplier(filter: DateFilter): number {
  if (filter.mode === 'month') return 1;
  if (filter.mode === 'year') return 12;

  const range = dateFilterToRange(filter);
  return budgetMultiplierForDateRange(range.startDate, range.endDate);
}

export function budgetForDateFilter(monthlyBudgetCents: number, filter: DateFilter): number {
  return Math.round(monthlyBudgetCents * dateFilterBudgetMultiplier(filter));
}

export function dateFilterBudgetLabel(filter: DateFilter): string {
  if (filter.mode === 'day') return 'Daily budget';
  if (filter.mode === 'month') return 'Monthly budget';
  if (filter.mode === 'range90') return '90-day span budget';
  if (filter.mode === 'rangeYear') return '1-year span budget';
  if (filter.mode === 'year') return 'Yearly budget · monthly × 12';

  return 'Budget';
}

export function shiftDateFilter(filter: DateFilter, delta: number): DateFilter {
  if (filter.mode === 'day') {
    return { mode: 'day', date: addDays(filter.date, delta) };
  }

  if (filter.mode === 'month') {
    return { mode: 'month', month: shiftMonthValue(filter.month, delta) };
  }

  if (filter.mode === 'range90') {
    return { mode: 'range90', startDate: addDays(filter.startDate, delta * 90) };
  }

  if (filter.mode === 'rangeYear') {
    return { mode: 'rangeYear', startDate: addYears(filter.startDate, delta) };
  }

  return { mode: 'year', year: filter.year + delta };
}

export function selectedDayForDateFilter(filter: DateFilter): string {
  if (filter.mode === 'day') return filter.date;
  return dateFilterToRange(filter).startDate;
}

export function normalizeRange(startDate: string, endDate: string): DateRange {
  return startDate <= endDate ? { startDate, endDate } : { startDate: endDate, endDate: startDate };
}

export function clampRangeToOneYear(startDate: string, endDate: string): DateRange {
  const normalized = normalizeRange(startDate, endDate);
  const maxEndDate = addDays(addYears(normalized.startDate, 1), -1);
  if (normalized.endDate > maxEndDate) return { startDate: normalized.startDate, endDate: maxEndDate };
  return normalized;
}

export function isRangeWithinOneYear(startDate: string, endDate: string): boolean {
  const normalized = normalizeRange(startDate, endDate);
  const maxEndDate = addDays(addYears(normalized.startDate, 1), -1);
  return normalized.endDate <= maxEndDate;
}

export function yearsAround(date = new Date(), radius = 6): number[] {
  const currentYear = date.getFullYear();
  return Array.from({ length: radius * 2 + 1 }, (_, index) => currentYear - radius + index);
}

function shiftMonthValue(monthString: string, delta: number): string {
  const [year, month] = monthString.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return currentMonthString(date);
}

function nextMonthStart(month: string): string {
  return shiftMonthValue(month, 1) + '-01';
}

function daysBetween(startDate: string, endDate: string): number {
  const start = parseDate(startDate).getTime();
  const end = parseDate(endDate).getTime();
  return Math.round((end - start) / 86_400_000);
}

function budgetMultiplierForDateRange(startDate: string, endDate: string): number {
  const normalized = normalizeRange(startDate, endDate);
  let cursor = normalized.startDate;
  let multiplier = 0;

  while (cursor <= normalized.endDate) {
    multiplier += 1 / daysInMonth(cursor);
    cursor = addDays(cursor, 1);
  }

  return multiplier;
}

function daysInMonth(dateString: string): number {
  const [year, month] = dateString.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function addYears(dateString: string, years: number): string {
  const date = parseDate(dateString);
  date.setFullYear(date.getFullYear() + years);
  return todayDateString(date);
}

function addDays(dateString: string, days: number): string {
  const date = parseDate(dateString);
  date.setDate(date.getDate() + days);
  return todayDateString(date);
}

function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
