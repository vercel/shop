import { cacheLife, cacheTag } from "next/cache";

import type { ContentPage } from "@/lib/pages/types";
import { fetchPage } from "@/lib/shopify/operations/pages/server";
import type { ShopifyLocale } from "@/lib/shopify/storefront/types";

export async function getPage(params: {
  handle: string;
  locale?: ShopifyLocale;
}): Promise<ContentPage | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("pages", `page-${params.handle}`);

  return fetchPage(params);
}
