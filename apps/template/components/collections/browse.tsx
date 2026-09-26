import { type ReactNode, Suspense } from "react";

import { ProductCard } from "@/components/product-card/product-card";
import { ProductsGridSkeleton } from "@/components/product/products-grid";
import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import type { BrowseResults, BrowseState } from "@/lib/collections/types";

import { CollectionBrowseProvider } from "./collection-browse-provider";
import { InfiniteProductGrid } from "./infinite-product-grid";
import { BrowseToolbar } from "./toolbar";

interface BrowseProps {
  resultCount?: ReactNode;
  resultsPromise: Promise<BrowseResults>;
  sortExclude?: string[];
  statePromise: Promise<BrowseState>;
  storeKey: string;
}

export function Browse({
  resultCount,
  resultsPromise,
  sortExclude,
  statePromise,
  storeKey,
}: BrowseProps) {
  return (
    <CollectionBrowseProvider handle={storeKey} statePromise={statePromise}>
      <BrowseToolbar
        facetsPromise={resultsPromise.then((results) => results.facets)}
        resultCount={resultCount}
        sortExclude={sortExclude}
      />
      <Suspense
        fallback={
          <ProductsGridSkeleton
            count={PRODUCTS_PER_PAGE}
            className="sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          />
        }
      >
        <BrowseResultsGrid resultsPromise={resultsPromise} />
      </Suspense>
    </CollectionBrowseProvider>
  );
}

async function BrowseResultsGrid({ resultsPromise }: { resultsPromise: Promise<BrowseResults> }) {
  const { dataSearch, pageInfo, products, source } = await resultsPromise;
  if (products.length === 0) {
    const query = source.type === "search" ? source.query : undefined;
    return (
      <div className="py-10 text-center">
        <h2 className="mb-2 text-2xl">No products found</h2>
        <p className="text-muted-foreground">
          {query ? `We couldn't find any products matching "${query}"` : "No products available"}
        </p>
      </div>
    );
  }
  return (
    <InfiniteProductGrid
      key={`${JSON.stringify(source)}?${dataSearch}`}
      initialPageInfo={pageInfo}
      initialProductIds={products.map((product) => product.id)}
      source={source}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} outOfStockText="Out of Stock" />
      ))}
    </InfiniteProductGrid>
  );
}
