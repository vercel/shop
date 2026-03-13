import "server-only";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/constants";

export function invalidateCartCache(): void {
  updateTag(TAGS.cart);
  updateTag("cart-status");
}
