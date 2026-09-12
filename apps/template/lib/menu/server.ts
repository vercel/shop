import { cacheLife, cacheTag } from "next/cache";

import { fetchMenu } from "@/lib/shopify/operations/menu/server";
import type { Menu } from "@/lib/shopify/transforms/menu/types";

export async function getMenu(params: { handle: string }): Promise<Menu | null> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("menus");

  return fetchMenu(params);
}
