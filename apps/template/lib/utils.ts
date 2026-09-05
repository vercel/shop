import { formatMoney } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";

export function formatPrice(
  money: { amount: number | string; currencyCode: string },
  locale: string = shopConfig.localization.locale,
): string {
  return formatMoney(
    { amount: String(money.amount), currencyCode: money.currencyCode },
    { currencyDisplay: "narrowSymbol", locale },
  ).localizedString;
}
