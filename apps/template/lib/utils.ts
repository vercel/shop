import { formatMoney } from "@shopify/hydrogen";

export { cn } from "cn";

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
