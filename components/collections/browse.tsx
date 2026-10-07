import { type ReactNode, Suspense } from "react";

import { ProductCard } from "@/components/product-card/product-card";
import { ProductsGridSkeleton } from "@/components/product/products-grid";
import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import type { BrowseResults, BrowseState, SortValue } from "@/lib/collections/types";

import {
  BROWSE_GRID_COLUMNS,
  BrowseDensityArea,
  BrowseGridArea,
  CollectionBrowseProvider,
} from "./collection-browse-provider";
import { CollectionFilters } from "./filters";
import { InfiniteProductGrid } from "./infinite-product-grid";
import { BrowseToolbar, BrowseToolbarFallback } from "./toolbar";

// Scrolls with a hidden scrollbar: a visible track inside a sticky sidebar reads as a seam.
const FACETS_SIDEBAR_CLASS =
  "hidden [scrollbar-width:none] lg:sticky lg:top-20 lg:block lg:max-h-[calc(100dvh-6rem)] lg:w-60 lg:shrink-0 lg:overflow-y-auto [&::-webkit-scrollbar]:hidden";

interface BrowseProps {
  resultCount?: ReactNode;
  resultsPromise: Promise<BrowseResults>;
  sortExclude?: SortValue[];
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
  // One promise for both facet surfaces so the desktop sidebar and the mobile sheet share a single read.
  const facetsPromise = resultsPromise.then((results) => results.facets);
  return (
    <CollectionBrowseProvider handle={storeKey} statePromise={statePromise}>
      <BrowseToolbar
        facetsPromise={facetsPromise}
        resultCount={resultCount}
        sortExclude={sortExclude}
      />
      <BrowseLayout
        facets={
          <CollectionFilters className={FACETS_SIDEBAR_CLASS} facetsPromise={facetsPromise} />
        }
      >
        <BrowseGridArea>
          <Suspense
            fallback={
              <ProductsGridSkeleton count={PRODUCTS_PER_PAGE} className={BROWSE_GRID_COLUMNS} />
            }
          >
            <BrowseResultsGrid resultsPromise={resultsPromise} />
          </Suspense>
        </BrowseGridArea>
      </BrowseLayout>
    </CollectionBrowseProvider>
  );
}

interface BrowseFallbackProps {
  resultCount?: ReactNode;
}

export function BrowseFallback({ resultCount }: BrowseFallbackProps) {
  return (
    <>
      <BrowseToolbarFallback resultCount={resultCount} />
      <BrowseLayout facets={<div className={FACETS_SIDEBAR_CLASS} />}>
        <BrowseDensityArea>
          <ProductsGridSkeleton count={PRODUCTS_PER_PAGE} className={BROWSE_GRID_COLUMNS} />
        </BrowseDensityArea>
      </BrowseLayout>
    </>
  );
}

// Flex, not a fixed grid template: a store with no facets drops the sidebar and the grid takes the full width.
function BrowseLayout({ children, facets }: { children: ReactNode; facets: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-10">
      {facets}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
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
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          loading={index < 5 ? "eager" : "lazy"}
          product={product}
          outOfStockText="Out of Stock"
          quickShopText="Choose"
        />
      ))}
    </InfiniteProductGrid>
  );
}
