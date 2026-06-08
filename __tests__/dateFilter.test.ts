import {
  budgetForDateFilter,
  clampRangeToOneYear,
  createDefaultDateFilter,
  dateFilterBudgetMultiplier,
  dateFilterBudgetLabel,
  dateFilterHelper,
  dateFilterLabel,
  dateFilterToRange,
  isRangeWithinOneYear,
  selectedDayForDateFilter,
  shiftDateFilter,
} from '../src/lib/dateFilter';

describe('date filter utilities', () => {
  it('creates day, month, span, and year query ranges', () => {
    expect(dateFilterToRange({ mode: 'day', date: '2026-02-14' })).toEqual({ startDate: '2026-02-14', endDate: '2026-02-14' });
    expect(dateFilterToRange({ mode: 'month', month: '2026-02' })).toEqual({ startDate: '2026-02-01', endDate: '2026-02-28' });
    expect(dateFilterToRange({ mode: 'range90', startDate: '2026-01-10' })).toEqual({ startDate: '2026-01-10', endDate: '2026-04-09' });
    expect(dateFilterToRange({ mode: 'rangeYear', startDate: '2026-01-10' })).toEqual({ startDate: '2026-01-10', endDate: '2027-01-09' });
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
    expect(shiftDateFilter({ mode: 'range90', startDate: '2026-01-01' }, 1)).toEqual({ mode: 'range90', startDate: '2026-04-01' });
    expect(shiftDateFilter({ mode: 'rangeYear', startDate: '2026-01-10' }, 1)).toEqual({ mode: 'rangeYear', startDate: '2027-01-10' });
    expect(shiftDateFilter({ mode: 'year', year: 2026 }, 1)).toEqual({ mode: 'year', year: 2027 });
  });

  it('labels defaults and modes clearly', () => {
    expect(createDefaultDateFilter(new Date(2026, 5, 2))).toEqual({ mode: 'day', date: '2026-06-02' });
    expect(dateFilterHelper({ mode: 'day', date: '2026-06-02' })).toBe('Day');
    expect(dateFilterHelper({ mode: 'range90', startDate: '2026-06-02' })).toBe('90-day span');
    expect(dateFilterHelper({ mode: 'rangeYear', startDate: '2026-06-02' })).toBe('1-year span');
    expect(dateFilterLabel({ mode: 'year', year: 2024 })).toBe('2024');
    expect(selectedDayForDateFilter({ mode: 'month', month: '2026-06' })).toBe('2026-06-01');
  });

  it('scales monthly budget by selected calendar span', () => {
    expect(dateFilterBudgetMultiplier({ mode: 'day', date: '2026-06-15' })).toBeCloseTo(1 / 30);
    expect(dateFilterBudgetMultiplier({ mode: 'month', month: '2026-06' })).toBe(1);
    expect(dateFilterBudgetMultiplier({ mode: 'range90', startDate: '2026-01-01' })).toBeCloseTo(3);
    expect(dateFilterBudgetMultiplier({ mode: 'rangeYear', startDate: '2026-01-01' })).toBeCloseTo(12);
    expect(dateFilterBudgetMultiplier({ mode: 'year', year: 2026 })).toBe(12);
    expect(budgetForDateFilter(100_00, { mode: 'year', year: 2026 })).toBe(1200_00);
  });

  it('uses daily budget for day view and explicit labels for spans', () => {
    expect(budgetForDateFilter(3000, { mode: 'day', date: '2026-06-15' })).toBe(100);
    expect(budgetForDateFilter(3100, { mode: 'day', date: '2026-01-15' })).toBe(100);
    expect(dateFilterBudgetLabel({ mode: 'day', date: '2026-06-15' })).toBe('Daily budget');
    expect(dateFilterBudgetLabel({ mode: 'range90', startDate: '2026-06-15' })).toBe('90-day span budget');
    expect(dateFilterBudgetLabel({ mode: 'rangeYear', startDate: '2026-06-15' })).toBe('1-year span budget');
  });
});
