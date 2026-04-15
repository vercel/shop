import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";

import { type CollectionResultsData, getExactCollectionResultCount } from "@/lib/collections/server";
import { ProductGridPendingOverlay } from "./filter-pending-context";
import { CollectionsPagination } from "./pagination";

const RESULTS_SKELETON_KEYS = Array.from(
  { length: 10 },
  (_, index) => `collection-results-skeleton-${index}`,
);

function Fallback() {
  return (
    <>
      <Skeleton className="mb-6 h-4 w-40" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {RESULTS_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-80 rounded-md" />
        ))}
      </div>
    </>
  );
}

async function Render({
  locale,
  collectionResultsDataPromise,
}: {
  locale: Locale;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  const [{ cursor, result }, t, tProduct] = await Promise.all([
    collectionResultsDataPromise,
    getTranslations("search"),
    getTranslations("product"),
  ]);
  const products = result.products;
  const exactCount = getExactCollectionResultCount({ cursor, result });

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <h2 className="mb-2 text-2xl font-semibold">{t("noResults")}</h2>
        <p className="text-muted-foreground">{t("noResultsAvailable")}</p>
      </div>
    );
  }

  return (
    <>
      {exactCount !== undefined && exactCount > 0 && (
        <div className="mb-6 hidden md:block">
          <p className="text-sm text-muted-foreground">{t("resultCount", { count: exactCount })}</p>
        </div>
      )}

      <ProductGridPendingOverlay>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              outOfStockText={tProduct("outOfStock")}
            />
          ))}
        </div>
      </ProductGridPendingOverlay>

      <CollectionsPagination
        hasNextPage={result.pageInfo.hasNextPage}
        endCursor={result.pageInfo.endCursor}
        isFirstPage={!cursor}
      />
    </>
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
