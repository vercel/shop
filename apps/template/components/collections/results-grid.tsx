import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import { loadMoreCollectionProducts } from "@/lib/collections/actions";
import type { CollectionResultsData } from "@/lib/collections/server";
import type { Locale } from "@/lib/i18n";

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
  const [{ result, filters, collection, sort }, t, tProduct] = await Promise.all([
    collectionResultsDataPromise,
    getTranslations("search"),
    getTranslations("product"),
  ]);
  const products = result.products;

  if (products.length === 0) {
    return (
      <div className="py-10 text-center">
        <h2 className="mb-2 text-2xl font-semibold">{t("noResults")}</h2>
        <p className="text-muted-foreground">{t("noResultsAvailable")}</p>
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
      initialProducts={products}
      initialPageInfo={result.pageInfo}
      locale={locale}
      outOfStockText={tProduct("outOfStock")}
      loadMore={boundLoadMore}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          outOfStockText={tProduct("outOfStock")}
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
