export const locales = ["en-US"] as const;

export type Locale = (typeof locales)[number];

// Deployment-level locale mode. By default the storefront runs in single-locale
// mode, but additional locales can be enabled here when the app is ready.
export const defaultLocale: Locale = "en-US";
export const enabledLocales: readonly Locale[] = [defaultLocale];
export const localeSwitchingEnabled = enabledLocales.length > 1;

/**
 * Type guard to check if a string is a valid locale
 */
export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function isEnabledLocale(value: string): value is Locale {
  return enabledLocales.includes(value as Locale);
}

/**
 * Safely convert a string to a supported locale.
 */
export function asLocale(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

/**
 * Resolve a locale for the current deployment. Unsupported or disabled values
 * fall back to the configured default locale.
 */
export function resolveLocale(value: string | null | undefined): Locale {
  return value && isEnabledLocale(value) ? value : defaultLocale;
}

// Explicit locale → currency mappings are only for configured multi-locale
// storefronts. Single-locale pricing should come from Shopify responses.
const localeCurrency: Record<Locale, { currency: string; symbol: string }> = {
  "en-US": { currency: "USD", symbol: "$" },
};

export type LocaleData = {
  label: string;
  code: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  currencyName: string;
};

export function getLocaleData(locale: string): LocaleData {
  const [lang, country] = locale.split("-");
  const currencyData = localeCurrency[locale as Locale] ?? localeCurrency[defaultLocale];

  // Get native language name (e.g., "Deutsch" for de-DE)
  const languageNames = new Intl.DisplayNames([locale], { type: "language" });
  const languageName = languageNames.of(lang) ?? lang;

  // Get currency name in the locale's language
  const currencyNames = new Intl.DisplayNames([locale], { type: "currency" });
  const currencyName = currencyNames.of(currencyData.currency) ?? currencyData.currency;

  return {
    label: `${languageName} - ${country}`,
    code: country,
    countryCode: country,
    currency: currencyData.currency,
    currencySymbol: currencyData.symbol,
    currencyName,
  };
}

export function getCountryCode(locale: string): string {
  return locale.split("-")[1] ?? "US";
}

export function getLanguageCode(locale: string): string {
  return (locale.split("-")[0] ?? "en").toUpperCase();
}

export function getCurrencyCode(locale: string): string {
  return (localeCurrency[locale as Locale] ?? localeCurrency[defaultLocale]).currency;
}

export type LocaleOption = {
  locale: Locale;
  label: string;
  countryCode: string;
};

export function getEnabledLocaleOptions(): LocaleOption[] {
  return enabledLocales.map((locale) => {
    const data = getLocaleData(locale);

    return {
      locale,
      label: data.label,
      countryCode: data.countryCode,
    };
  });
}

export type EnabledCurrencyOption = {
  code: string;
  symbol: string;
  name: string;
};

export function getEnabledCurrencies(): EnabledCurrencyOption[] {
  const currencies = new Map<string, EnabledCurrencyOption>();

  for (const locale of enabledLocales) {
    const data = getLocaleData(locale);

    if (!currencies.has(data.currency)) {
      currencies.set(data.currency, {
        code: data.currency,
        symbol: data.currencySymbol,
        name: data.currencyName,
      });
    }
  }

  return Array.from(currencies.values());
}

export function getPrimaryLocaleForCurrency(currency: string): Locale | null {
  return enabledLocales.find((locale) => getCurrencyCode(locale) === currency) ?? null;
}

export function getLocaleFlag(locale: string): string {
  const codePoints = getCountryCode(locale)
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
