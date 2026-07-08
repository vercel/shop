import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { isLocale, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const current = await rootLocale();
  if (!current || !isLocale(current)) notFound();
  return current;
}
