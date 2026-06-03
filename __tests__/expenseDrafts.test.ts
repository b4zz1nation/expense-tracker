import { itemizedValuesToExpenseDrafts } from '../src/lib/expenseDrafts';

describe('itemizedValuesToExpenseDrafts', () => {
  it('maps each category item to a separate expense draft using item label as note', () => {
    const drafts = itemizedValuesToExpenseDrafts({
      categoryId: 'food',
      spentOn: '2026-06-02',
      items: [
        { label: 'Burger', amount: '8.50' },
        { label: 'Fries', amount: '3.25' },
      ],
    }, 'USD');

    expect(drafts).toEqual([
      {
        amountCents: 850,
        currency: 'USD',
        categoryId: 'food',
        note: 'Burger',
        spentOn: '2026-06-02',
      },
      {
        amountCents: 325,
        currency: 'USD',
        categoryId: 'food',
        note: 'Fries',
        spentOn: '2026-06-02',
      },
    ]);
  });
});
