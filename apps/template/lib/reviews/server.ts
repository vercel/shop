import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import type { ProductReviews } from "@/lib/types";

export async function getProductReviews(handle: string): Promise<ProductReviews> {
  "use cache";
  cacheLife("max");
  cacheTag(`product-reviews-${handle}`);

  const seed = hashHandle(handle);
  const rating = 3 + (seed % 2001) / 1000;
  const count = 12 + ((seed >>> 4) % 2488);

  return {
    rating: Math.round(rating * 100) / 100,
    count,
  };
}

function hashHandle(handle: string): number {
  let hash = 2166136261;
  for (let i = 0; i < handle.length; i++) {
    hash ^= handle.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
