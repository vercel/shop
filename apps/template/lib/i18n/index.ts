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

// Public URLs hide the locale, so API requests use the same cookie as the proxy.
export function getRequestLocale(request: { headers: Pick<Headers, "get">; url?: string }): Locale {
  const url = request.url ?? request.headers.get("x-storefront-url");
  if (url) {
    try {
      const segments = new URL(url).pathname.split("/").filter(Boolean);
      const pathLocale = isEnabledLocale(segments[0] ?? "")
        ? segments[0]
        : isEnabledLocale(segments[1] ?? "")
          ? segments[1]
          : undefined;
      if (pathLocale) return resolveLocale(pathLocale);
    } catch {
      // Invalid forwarded URLs must not prevent cookie-based locale resolution.
    }
  }
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .find((part) => part.trim().startsWith("NEXT_LOCALE="));
  return resolveLocale(cookie?.trim().slice("NEXT_LOCALE=".length));
}

export function getCountryCode(locale: string): string {
  return locale.split("-")[1] ?? "US";
}

export function getLanguageCode(locale: string): string {
  return (locale.split("-")[0] ?? "en").toUpperCase();
}
