import {
  budgetForDateFilter,
  clampRangeToOneYear,
  createDefaultDateFilter,
  createTodayDateFilter,
  dateFilterExpensesTitle,
  dateFilterHelper,
  dateFilterLabel,
  dateFilterToRange,
  isRangeWithinOneYear,
  selectedDayForDateFilter,
  shiftDateFilter,
} from '../src/lib/dateFilter';

describe('date filter utilities', () => {
  it('creates day, month, custom range, and year query ranges', () => {
    expect(dateFilterToRange({ mode: 'day', date: '2026-02-14' })).toEqual({ startDate: '2026-02-14', endDate: '2026-02-14' });
    expect(dateFilterToRange({ mode: 'month', month: '2026-02' })).toEqual({ startDate: '2026-02-01', endDate: '2026-02-28' });
    expect(dateFilterToRange({ mode: 'range', startDate: '2026-01-10', endDate: '2026-01-20' })).toEqual({ startDate: '2026-01-10', endDate: '2026-01-20' });
    expect(dateFilterToRange({ mode: 'range', startDate: '2026-01-20', endDate: '2026-01-10' })).toEqual({ startDate: '2026-01-10', endDate: '2026-01-20' });
    expect(dateFilterToRange({ mode: 'year', year: 2025 })).toEqual({ startDate: '2025-01-01', endDate: '2025-12-31' });
  });

  it('limits custom ranges to one year for legacy helpers', () => {
    expect(isRangeWithinOneYear('2025-01-01', '2025-12-31')).toBe(true);
    expect(isRangeWithinOneYear('2025-01-01', '2026-01-01')).toBe(false);
    expect(clampRangeToOneYear('2025-01-01', '2026-03-10')).toEqual({ startDate: '2025-01-01', endDate: '2025-12-31' });
  });

  it('shifts each filter mode predictably', () => {
    expect(shiftDateFilter({ mode: 'day', date: '2026-01-01' }, -1)).toEqual({ mode: 'day', date: '2025-12-31' });
    expect(shiftDateFilter({ mode: 'month', month: '2026-01' }, -1)).toEqual({ mode: 'month', month: '2025-12' });
    expect(shiftDateFilter({ mode: 'range', startDate: '2026-01-01', endDate: '2026-01-10' }, 1)).toEqual({ mode: 'range', startDate: '2026-01-11', endDate: '2026-01-20' });
    expect(shiftDateFilter({ mode: 'year', year: 2026 }, 1)).toEqual({ mode: 'year', year: 2027 });
  });

  it('labels defaults and modes clearly', () => {
    expect(createDefaultDateFilter(new Date(2026, 5, 2))).toEqual({ mode: 'month', month: '2026-06' });
    expect(createTodayDateFilter(new Date(2026, 5, 2))).toEqual({ mode: 'day', date: '2026-06-02' });
    expect(dateFilterHelper({ mode: 'day', date: '2026-06-02' })).toBe('Day');
    expect(dateFilterHelper({ mode: 'range', startDate: '2026-06-02', endDate: '2026-06-09' })).toBe('Range');
    expect(dateFilterLabel({ mode: 'year', year: 2024 })).toBe('2024');
    expect(selectedDayForDateFilter({ mode: 'month', month: '2026-06' })).toBe('2026-06-01');
    expect(dateFilterExpensesTitle({ mode: 'day', date: '2026-06-02' })).toBe('Day view expenses');
    expect(dateFilterExpensesTitle({ mode: 'month', month: '2026-06' })).toBe('Month view expenses');
    expect(dateFilterExpensesTitle({ mode: 'range', startDate: '2026-06-02', endDate: '2026-06-09' })).toBe('Range view expenses');
    expect(dateFilterExpensesTitle({ mode: 'year', year: 2026 })).toBe('Year view expenses');
  });

  it('scales monthly budgets by active date filter', () => {
    expect(budgetForDateFilter(31_000, { mode: 'day', date: '2026-01-15' })).toBe(1_000);
    expect(budgetForDateFilter(31_000, { mode: 'month', month: '2026-01' })).toBe(31_000);
    expect(budgetForDateFilter(31_000, { mode: 'year', year: 2026 })).toBe(372_000);
  });
});
