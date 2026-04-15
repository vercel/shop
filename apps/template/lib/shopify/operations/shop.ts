import { cacheLife, cacheTag } from "next/cache";

import { shopifyFetch } from "../client";

type PaymentSettingsResponse = {
  paymentSettings: {
    currencyCode: string;
  };
};

export async function getShopDefaultCurrencyCode(): Promise<string> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("shop");

  const data = await shopifyFetch<PaymentSettingsResponse>({
    operation: "getShopDefaultCurrencyCode",
    query: `
      query getShopDefaultCurrencyCode {
        paymentSettings {
          currencyCode
        }
      }
    `,
  });

  return data.paymentSettings.currencyCode;
}
