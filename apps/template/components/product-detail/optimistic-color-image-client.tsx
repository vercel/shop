"use client";

import { ColorImageCarouselItems, ColorImageGrid } from "@/components/product-detail/product-media";
import { useVariantSelection } from "@/components/product-detail/variant-selection-client";
import { getSelectedColorImage, type SelectedOptions } from "@/lib/product";
import type { ProductDetails } from "@/lib/types";

interface OptimisticColorImageProps {
  layout: "carousel" | "grid";
  product: ProductDetails;
  selectedOptions: SelectedOptions;
}

export function OptimisticColorImage({
  layout,
  product,
  selectedOptions,
}: OptimisticColorImageProps) {
  const { optimisticOptions } = useVariantSelection();
  const image = getSelectedColorImage(product, optimisticOptions ?? selectedOptions);
  if (!image) return null;
  return layout === "grid" ? (
    <ColorImageGrid images={[image]} title={product.title} />
  ) : (
    <ColorImageCarouselItems images={[image]} title={product.title} />
  );
}
