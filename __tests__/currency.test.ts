import { formatCents, parseMoneyToCents } from '../src/lib/currency';

describe('currency utilities', () => {
  it('parses decimal money into cents', () => {
    expect(parseMoneyToCents('12.34')).toBe(1234);
    expect(parseMoneyToCents('12')).toBe(1200);
    expect(parseMoneyToCents('$1,234.50')).toBe(123450);
  });

  it('rejects invalid amounts', () => {
    expect(() => parseMoneyToCents('0')).toThrow();
    expect(() => parseMoneyToCents('-1')).toThrow();
    expect(() => parseMoneyToCents('12.345')).toThrow();
    expect(() => parseMoneyToCents('abc')).toThrow();
  });

  it('formats cents as currency', () => {
    expect(formatCents(1234)).toBe('$12.34');
  });
});
