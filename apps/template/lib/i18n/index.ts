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

export function resolveLocale(value: string | null | undefined): Locale {
  return value && isEnabledLocale(value) ? value : defaultLocale;
}

export function getCountryCode(locale: string): string {
  return locale.split("-")[1] ?? "US";
}

export function getLanguageCode(locale: string): string {
  return (locale.split("-")[0] ?? "en").toUpperCase();
}
