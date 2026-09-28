import { formatMoney } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import type { Money } from "@/lib/money/types";

export function formatCurrencySymbol(
  currencyCode: string,
  locale: string = shopConfig.localization.locale,
): string {
  return formatMoney({ amount: "0", currencyCode }, { locale }).currencySymbol;
}

export function formatPrice(money: Money, locale: string = shopConfig.localization.locale): string {
  return formatMoney(money, { locale }).localizedString;
}
