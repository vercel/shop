import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import { loadMoreCollectionProducts } from "@/lib/collections/action";
import type { CollectionResultsData } from "@/lib/collections/server";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n/server";

import { InfiniteProductGrid } from "./infinite-product-grid";

const RESULTS_SKELETON_KEYS = Array.from(
  { length: 15 },
  (_, index) => `collection-results-skeleton-${index}`,
);

function Fallback() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {RESULTS_SKELETON_KEYS.map((key) => (
        <ProductCardSkeleton key={key} />
      ))}
    </div>
  );
}

async function Render({
  locale,
  collectionResultsDataPromise,
}: {
  locale: Locale;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  const [
    { result, filters, collection, sort },
    noResults,
    noResultsAvailable,
    outOfStockText,
    addToCartLabel,
  ] = await Promise.all([
    collectionResultsDataPromise,
    t("search.noResults"),
    t("search.noResultsAvailable"),
    t("product.outOfStock"),
    t("product.addToCart"),
  ]);
  const products = result.products;

  if (products.length === 0) {
    return (
      <div className="py-10 text-center">
        <h2 className="mb-2 text-2xl font-semibold">{noResults}</h2>
        <p className="text-muted-foreground">{noResultsAvailable}</p>
      </div>
    );
  }

  const boundLoadMore = async (cursor: string) => {
    "use server";
    return loadMoreCollectionProducts({
      collection,
      cursor,
      sortKey: sort,
      filters,
      locale,
    });
  };

  return (
    <InfiniteProductGrid
      addToCartLabel={addToCartLabel}
      initialProducts={products}
      initialPageInfo={result.pageInfo}
      locale={locale}
      outOfStockText={outOfStockText}
      loadMore={boundLoadMore}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          outOfStockText={outOfStockText}
        />
      ))}
    </InfiniteProductGrid>
  );
}

export function CollectionResultsGrid({
  locale,
  collectionResultsDataPromise,
}: {
  locale: Locale;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Render locale={locale} collectionResultsDataPromise={collectionResultsDataPromise} />
    </Suspense>
  );
}
