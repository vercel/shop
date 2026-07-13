export const locales = ["en-CA", "en-US", "fr-CA"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en-US";
export const enabledLocales: readonly Locale[] = ["en-US", "en-CA", "fr-CA"];
export const localeSwitchingEnabled = enabledLocales.length > 1;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function isEnabledLocale(value: string): value is Locale {
  return enabledLocales.includes(value as Locale);
}

export function asLocale(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function resolveLocale(value: string | null | undefined): Locale {
  return value && isEnabledLocale(value) ? value : defaultLocale;
}

export interface LocaleData {
  code: string;
  countryCode: string;
  label: string;
}

export function getLocaleData(locale: Locale): LocaleData {
  const [language, country] = locale.split("-");
  const languageNames = new Intl.DisplayNames([locale], { type: "language" });
  const languageName = languageNames.of(language) ?? language;

  return {
    code: country,
    countryCode: country,
    label: `${languageName} - ${country}`,
  };
}

export function getCountryCode(locale: string): string {
  return locale.split("-")[1] ?? "US";
}

export function getLanguageCode(locale: string): string {
  return (locale.split("-")[0] ?? "en").toUpperCase();
}

export interface LocaleOption {
  countryCode: string;
  label: string;
  locale: Locale;
}

export function getEnabledLocaleOptions(): LocaleOption[] {
  return enabledLocales.map((locale) => {
    const data = getLocaleData(locale);

    return {
      countryCode: data.countryCode,
      label: data.label,
      locale,
    };
  });
}

export function getLocaleFlag(locale: Locale): string {
  const codePoints = getCountryCode(locale)
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
