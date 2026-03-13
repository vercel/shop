import { defaultLocale, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  return defaultLocale;
}
