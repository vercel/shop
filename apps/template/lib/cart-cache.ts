import "server-only";
import { revalidateTag, updateTag } from "next/cache";

import { TAGS } from "@/lib/constants";

export function invalidateCartCache(): void {
  try {
    updateTag(TAGS.cart);
  } catch {
    // Fallback when used outside of server actions where updateTag is not available
    revalidateTag(TAGS.cart, { expire: 0 });
  }
}
