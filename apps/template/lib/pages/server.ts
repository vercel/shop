import { cacheLife, cacheTag } from "next/cache";

import type { CommerceLocale } from "@/lib/config/types";
import type { ContentPage } from "@/lib/pages/types";
import { fetchPage } from "@/lib/shopify/operations/pages/server";

export async function getPage(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ContentPage | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("pages", `page-${params.handle}`);

  return fetchPage(params);
}
