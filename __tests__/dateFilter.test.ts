import {
  budgetForDateFilter,
  clampRangeToOneYear,
  createDefaultDateFilter,
  dateFilterBudgetMultiplier,
  dateFilterLabel,
  dateFilterToRange,
  isRangeWithinOneYear,
  shiftDateFilter,
} from '../src/lib/dateFilter';

describe('date filter utilities', () => {
  it('creates month, range, and year query ranges', () => {
    expect(dateFilterToRange({ mode: 'month', month: '2026-02' })).toEqual({ startDate: '2026-02-01', endDate: '2026-02-28' });
    expect(dateFilterToRange({ mode: 'year', year: 2025 })).toEqual({ startDate: '2025-01-01', endDate: '2025-12-31' });
    expect(dateFilterToRange({ mode: 'range', startDate: '2026-01-10', endDate: '2026-01-12' })).toEqual({ startDate: '2026-01-10', endDate: '2026-01-12' });
  });

  it('limits custom ranges to one year', () => {
    expect(isRangeWithinOneYear('2025-01-01', '2025-12-31')).toBe(true);
    expect(isRangeWithinOneYear('2025-01-01', '2026-01-01')).toBe(false);
    expect(clampRangeToOneYear('2025-01-01', '2026-03-10')).toEqual({ startDate: '2025-01-01', endDate: '2025-12-31' });
  });

  it('shifts each filter mode predictably', () => {
    expect(shiftDateFilter({ mode: 'month', month: '2026-01' }, -1)).toEqual({ mode: 'month', month: '2025-12' });
    expect(shiftDateFilter({ mode: 'year', year: 2026 }, 1)).toEqual({ mode: 'year', year: 2027 });
    expect(shiftDateFilter({ mode: 'range', startDate: '2026-01-01', endDate: '2026-01-07' }, 1)).toEqual({ mode: 'range', startDate: '2026-01-08', endDate: '2026-01-14' });
  });

  it('labels defaults clearly', () => {
    expect(createDefaultDateFilter(new Date(2026, 5, 2))).toEqual({ mode: 'month', month: '2026-06' });
    expect(dateFilterLabel({ mode: 'year', year: 2024 })).toBe('2024');
  });

  it('scales monthly budget by selected calendar span', () => {
    expect(dateFilterBudgetMultiplier({ mode: 'month', month: '2026-06' })).toBe(1);
    expect(dateFilterBudgetMultiplier({ mode: 'range', startDate: '2026-01-01', endDate: '2026-06-30' })).toBe(6);
    expect(dateFilterBudgetMultiplier({ mode: 'year', year: 2026 })).toBe(12);
    expect(budgetForDateFilter(100_00, { mode: 'range', startDate: '2026-01-01', endDate: '2026-06-30' })).toBe(600_00);
  });
});
