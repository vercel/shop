import { cacheLife, cacheTag } from "next/cache";

import type { CommerceLocale } from "@/lib/config/types";
import type { ContentPage, ShopPolicy } from "@/lib/content/types";
import { fetchPage } from "@/lib/shopify/operations/pages/server";
import { fetchShopPolicies } from "@/lib/shopify/operations/policies/server";

export async function getPage(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ContentPage | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("pages", `page-${params.handle}`);

  return fetchPage(params);
}

export async function getShopPolicies(
  params: { locale?: CommerceLocale } = {},
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
  locale?: CommerceLocale;
}): Promise<ShopPolicy | undefined> {
  const policies = await getShopPolicies({ locale });
  return policies.find((policy) => policy.handle === handle);
}
