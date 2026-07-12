export const locales = ["en-US"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en-US";
export const enabledLocales: readonly Locale[] = [defaultLocale];
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

export type LocaleData = {
  code: string;
  countryCode: string;
  label: string;
};

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

export function getLocaleFlag(locale: Locale): string {
  const codePoints = getCountryCode(locale)
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
