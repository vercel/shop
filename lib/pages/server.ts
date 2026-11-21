import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CommerceLocale } from "@/lib/config/types";
import type { ContentPage } from "@/lib/pages/types";
import { fetchPage } from "@/lib/shopify/operations/pages/server";

export async function getPage(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ContentPage | undefined> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(CACHE_TAGS.pages, CACHE_TAGS.page(params.handle));

  return fetchPage(params);
}
