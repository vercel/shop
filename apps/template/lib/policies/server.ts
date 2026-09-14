import { cacheLife, cacheTag } from "next/cache";

import type { ShopPolicy } from "@/lib/policies/types";
import { fetchShopPolicies } from "@/lib/shopify/operations/policies/server";
import type { ShopifyLocale } from "@/lib/shopify/storefront/types";

export async function getShopPolicies(
  params: { locale?: ShopifyLocale } = {},
): Promise<ShopPolicy[]> {
  "use cache";
  cacheLife("max");
  cacheTag("policies");

  return fetchShopPolicies(params);
}

export async function getShopPolicy({
  handle,
  locale,
}: {
  handle: string;
  locale?: ShopifyLocale;
}): Promise<ShopPolicy | undefined> {
  const policies = await getShopPolicies({ locale });
  return policies.find((policy) => policy.handle === handle);
}
