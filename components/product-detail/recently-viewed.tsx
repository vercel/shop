"use client";

import { useEffect } from "react";

import { recordRecentlyViewedProduct } from "@/lib/product/client";
import type { RecentlyViewedProduct } from "@/lib/product/types";

export function RecentlyViewedRecorder({ product }: { product: RecentlyViewedProduct }) {
  const { featuredImage, handle, id, price, title } = product;
  useEffect(() => {
    recordRecentlyViewedProduct({ featuredImage, handle, id, price, title });
  }, [featuredImage, handle, id, price, title]);
  return null;
}
