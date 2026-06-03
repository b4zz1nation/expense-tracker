import { currentMonthString, isDateString, shiftMonth, todayDateString } from '../src/lib/dates';

describe('date utilities', () => {
  it('formats local date strings', () => {
    expect(todayDateString(new Date(2026, 5, 2))).toBe('2026-06-02');
    expect(currentMonthString(new Date(2026, 5, 2))).toBe('2026-06');
  });

  it('validates real calendar dates', () => {
    expect(isDateString('2026-06-02')).toBe(true);
    expect(isDateString('2026-02-31')).toBe(false);
    expect(isDateString('bad')).toBe(false);
  });

  it('shifts months across years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
});
