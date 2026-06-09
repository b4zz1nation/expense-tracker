import { expenseSchema } from '../src/schemas/expenseSchema';

describe('expense schema', () => {
  const valid = {
    categoryId: 'food',
    spentOn: '2026-06-02',
    groupNote: '',
    items: [{ label: 'Lunch', amount: '12.34' }],
  };

  it('accepts a valid itemized expense form', () => {
    expect(expenseSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts multiple items for the selected category', () => {
    const result = expenseSchema.safeParse({
      categoryId: 'food',
      spentOn: '2026-06-02',
      groupNote: 'Team lunch',
      items: [
        { label: 'Burger', amount: '8.50' },
        { label: 'Fries', amount: '3.25' },
        { label: 'Drink', amount: '2.00' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts custom category ids from category-budget setup', () => {
    expect(expenseSchema.safeParse({ ...valid, categoryId: 'custom-pets-abc123' }).success).toBe(true);
  });

  it('rejects invalid amount, blank category, date, and item labels', () => {
    expect(expenseSchema.safeParse({ ...valid, items: [{ label: 'Burger', amount: '0' }] }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, categoryId: '' }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, spentOn: '2026-02-31' }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, items: [{ label: '', amount: '8.50' }] }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, groupNote: 'x'.repeat(81) }).success).toBe(false);
  });
});
