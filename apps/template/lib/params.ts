import { notFound } from "next/navigation";
import { flags as rootFlags, locale as rootLocale } from "next/root-params";

import { isLocale, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const current = await rootLocale();
  if (!current || !isLocale(current)) notFound();
  return current;
}

// Encrypted output of flags/next precompute; pass to a flag call with the
// precomputedFlags group to read the precomputed value instead of deciding.
export async function getFlagsCode(): Promise<string> {
  const current = await rootFlags();
  if (!current) notFound();
  return current;
}
