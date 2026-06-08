import { getCurrencyOption, getCurrencyOptions, getDeviceDefaultCurrencyCode } from '../src/lib/currencies';

describe('currency options', () => {
  it('uses PHP as the app default currency', () => {
    expect(getDeviceDefaultCurrencyCode()).toBe('PHP');
    expect(getCurrencyOptions()[0]?.code).toBe('PHP');
  });

  it('uses the correct country flags for USD and PHP', () => {
    expect(getCurrencyOption('USD')?.flagEmoji).toBe('🇺🇸');
    expect(getCurrencyOption('PHP')?.flagEmoji).toBe('🇵🇭');
  });
});
