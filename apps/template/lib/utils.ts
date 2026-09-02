import { formatMoney } from "@shopify/hydrogen";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  money: { amount: number | string; currencyCode: string },
  locale: string,
): string {
  return formatMoney(
    { amount: String(money.amount), currencyCode: money.currencyCode },
    { currencyDisplay: "narrowSymbol", locale },
  ).localizedString;
}

export const RESULTS_PER_PAGE = 40;
