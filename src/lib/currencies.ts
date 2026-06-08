import * as Localization from 'expo-localization';
import countryToCurrency from 'country-to-currency';
import currencyCodes from 'currency-codes';
import currencySymbolMap from 'currency-symbol-map';

export type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
  digits: number;
  flagEmoji: string;
};

export const DEFAULT_CURRENCY_CODE = 'PHP';

const PREFERRED_CURRENCY_REGIONS: Record<string, string> = {
  PHP: 'PH',
  USD: 'US',
};

const currencyCodeToRegion = new Map<string, string>();
for (const [regionCode, currencyCode] of Object.entries(countryToCurrency)) {
  if (!currencyCodeToRegion.has(currencyCode)) currencyCodeToRegion.set(currencyCode, regionCode);
}
for (const [currencyCode, regionCode] of Object.entries(PREFERRED_CURRENCY_REGIONS)) {
  currencyCodeToRegion.set(currencyCode, regionCode);
}

function regionCodeToFlagEmoji(regionCode: string): string {
  return regionCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

const CURRENCY_OPTIONS: CurrencyOption[] = currencyCodes.data
  .filter((entry) => /^[A-Z]{3}$/.test(entry.code))
  .map((entry) => {
    const regionCode = currencyCodeToRegion.get(entry.code);
    return {
      code: entry.code,
      name: entry.currency,
      symbol: currencySymbolMap(entry.code) || entry.code,
      digits: entry.digits,
      flagEmoji: regionCode ? regionCodeToFlagEmoji(regionCode) : '🏳️',
    };
  })
  .sort((left, right) => {
    if (left.code === DEFAULT_CURRENCY_CODE) return -1;
    if (right.code === DEFAULT_CURRENCY_CODE) return 1;
    return left.name.localeCompare(right.name) || left.code.localeCompare(right.code);
  });

export function getCurrencyOptions(): CurrencyOption[] {
  return CURRENCY_OPTIONS;
}

export function getCurrencyOption(code: string | null | undefined): CurrencyOption | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  return CURRENCY_OPTIONS.find((entry) => entry.code === normalized) ?? null;
}

function getRegionCodeFromLocale(): string | null {
  const locale = Localization.getLocales()[0];
  const languageTag = locale?.languageTag ?? (typeof navigator !== 'undefined' ? navigator.language : '');
  const fromLocale = locale?.regionCode?.toUpperCase();
  if (fromLocale) return fromLocale;

  const [_, regionPart] = languageTag.split(/[-_]/);
  return regionPart?.toUpperCase() ?? null;
}

export function getDeviceDefaultCurrencyCode(): string {
  return DEFAULT_CURRENCY_CODE;
}

export function getLocaleCurrencyCode(): string {
  const locale = Localization.getLocales()[0];
  const directCurrency = locale?.currencyCode?.trim().toUpperCase();
  if (directCurrency && getCurrencyOption(directCurrency)) {
    return directCurrency;
  }

  const regionCode = getRegionCodeFromLocale();
  if (regionCode) {
    const mapped = countryToCurrency[regionCode as keyof typeof countryToCurrency];
    if (mapped && getCurrencyOption(mapped)) {
      return mapped;
    }
  }

  return DEFAULT_CURRENCY_CODE;
}

export function getCurrencyDisplayName(code: string): string {
  return getCurrencyOption(code)?.name ?? code.toUpperCase();
}

export function getCurrencySymbol(code: string): string {
  return getCurrencyOption(code)?.symbol ?? code.toUpperCase();
}
