import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price with locale-aware currency formatting
 * @param amount - The price amount (as number)
 * @param currencyCode - ISO 4217 currency code (e.g., "USD", "EUR")
 * @param locale - Locale string (e.g., "en-US", "de-DE")
 */
export function formatPrice(
  amount: number,
  currencyCode: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}
