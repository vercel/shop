import { Suspense } from "react";

import { ProductsSlider } from "@/components/product/products-slider";
import { RelatedProductsSectionSkeleton } from "@/components/product/related-products-section";
import type { Locale } from "@/lib/i18n";
import { getCollectionProducts } from "@/lib/shopify/operations/products";

interface CollectionSliderProps {
  collection: string;
  title: string;
  locale: Locale;
  limit?: number;
}

async function Render({ collection, title, locale, limit }: CollectionSliderProps) {
  const { products } = await getCollectionProducts({ collection, limit, locale });
  if (products.length === 0) return null;
  return <ProductsSlider title={title} products={products} locale={locale} />;
}

export function CollectionSlider({ collection, title, locale, limit = 8 }: CollectionSliderProps) {
  return (
    <Suspense fallback={<RelatedProductsSectionSkeleton title={title} />}>
      <Render collection={collection} title={title} locale={locale} limit={limit} />
    </Suspense>
  );
}
