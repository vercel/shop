import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { type Locale, locales } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const currentLocale = await rootLocale();
  if (!currentLocale || !locales.includes(currentLocale as Locale)) notFound();
  return currentLocale as Locale;
}
