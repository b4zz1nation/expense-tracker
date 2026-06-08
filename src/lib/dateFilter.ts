import { currentMonthString, formatDateLabel, monthLabel, todayDateString } from './dates';

export type DateFilterMode = 'month' | 'range' | 'year';

export type DateFilter =
  | { mode: 'month'; month: string }
  | { mode: 'range'; startDate: string; endDate: string }
  | { mode: 'year'; year: number };

export type DateRange = {
  startDate: string;
  endDate: string;
};

export function createDefaultDateFilter(date = new Date()): DateFilter {
  return { mode: 'month', month: currentMonthString(date) };
}

export function dateFilterToRange(filter: DateFilter): DateRange {
  if (filter.mode === 'month') {
    return {
      startDate: `${filter.month}-01`,
      endDate: addDays(nextMonthStart(filter.month), -1),
    };
  }

  if (filter.mode === 'year') {
    return {
      startDate: `${filter.year}-01-01`,
      endDate: `${filter.year}-12-31`,
    };
  }

  return { startDate: filter.startDate, endDate: filter.endDate };
}

export function dateFilterLabel(filter: DateFilter): string {
  if (filter.mode === 'month') return monthLabel(filter.month);
  if (filter.mode === 'year') return String(filter.year);

  if (filter.startDate === filter.endDate) return formatDateLabel(filter.startDate);
  return `${formatDateLabel(filter.startDate)} – ${formatDateLabel(filter.endDate)}`;
}

export function dateFilterHelper(filter: DateFilter): string {
  if (filter.mode === 'month') return 'Monthly';
  if (filter.mode === 'year') return 'Yearly';
  return 'Custom range';
}


export function dateFilterBudgetMultiplier(filter: DateFilter): number {
  if (filter.mode === 'month') return 1;
  if (filter.mode === 'year') return 12;

  return budgetMultiplierForDateRange(filter.startDate, filter.endDate);
}

export function budgetForDateFilter(monthlyBudgetCents: number, filter: DateFilter): number {
  return Math.round(monthlyBudgetCents * dateFilterBudgetMultiplier(filter));
}

export function dateFilterBudgetLabel(filter: DateFilter): string {
  if (filter.mode === 'month') return 'Monthly budget';
  if (filter.mode === 'year') return 'Yearly budget · monthly × 12';

  const days = daysInRange(filter.startDate, filter.endDate);
  if (days === 1) return 'Daily budget';
  return `${days}-day range budget`;
}

export function shiftDateFilter(filter: DateFilter, delta: number): DateFilter {
  if (filter.mode === 'month') {
    return { mode: 'month', month: shiftMonthValue(filter.month, delta) };
  }

  if (filter.mode === 'year') {
    return { mode: 'year', year: filter.year + delta };
  }

  const { startDate, endDate } = filter;
  const days = Math.max(1, daysBetween(startDate, endDate) + 1);
  return {
    mode: 'range',
    startDate: addDays(startDate, delta * days),
    endDate: addDays(endDate, delta * days),
  };
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

function daysInRange(startDate: string, endDate: string): number {
  const normalized = normalizeRange(startDate, endDate);
  return Math.max(1, daysBetween(normalized.startDate, normalized.endDate) + 1);
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
