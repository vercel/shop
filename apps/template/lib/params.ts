import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { type Locale, locales } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const current = await rootLocale();
  if (!current || !locales.includes(current as Locale)) notFound();
  return current as Locale;
}
