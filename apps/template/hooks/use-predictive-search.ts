"use client";

import type { PredictiveSearchData } from "@shopify/hydrogen";
import {
  usePredictiveSearch as useHydrogenPredictiveSearch,
  usePredictiveSearchActions,
} from "@shopify/hydrogen/react";
import { useCallback, useState } from "react";

import type { PredictiveSearchResult } from "@/lib/types";

type HydrogenProduct = PredictiveSearchData["items"]["products"][number] & {
  availableForSale: boolean;
  compareAtPriceRange?: { minVariantPrice: { amount: string; currencyCode: string } } | null;
  featuredImage: {
    altText?: string | null;
    height: number;
    url: string;
    width: number;
  } | null;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  vendor?: string | null;
};

type HydrogenQuery = PredictiveSearchData["items"]["queries"][number] & {
  styledText: string;
};

interface HydrogenPredictiveSearchData extends PredictiveSearchData {
  items: Omit<PredictiveSearchData["items"], "products" | "queries"> & {
    products: HydrogenProduct[];
    queries: HydrogenQuery[];
  };
}

export function usePredictiveSearch() {
  const { clear, search } = usePredictiveSearchActions();
  const state = useHydrogenPredictiveSearch<HydrogenPredictiveSearchData>();
  const [activeIndex, setActiveIndex] = useState(-1);
  const results: PredictiveSearchResult | null =
    state.status === "idle"
      ? null
      : {
          collections: state.result.items.collections,
          products: state.result.items.products.map((product) => ({
            availableForSale: product.availableForSale,
            compareAtPrice: product.compareAtPriceRange?.minVariantPrice ?? undefined,
            featuredImage: product.featuredImage
              ? {
                  altText: product.featuredImage.altText ?? "",
                  height: product.featuredImage.height,
                  url: product.featuredImage.url,
                  width: product.featuredImage.width,
                }
              : null,
            handle: product.handle,
            id: product.id,
            price: product.priceRange.minVariantPrice,
            title: product.title,
            vendor: product.vendor || undefined,
          })),
          queries: state.result.items.queries,
        };

  const setQuery = useCallback(
    (query: string) => {
      setActiveIndex(-1);
      void search(query);
    },
    [search],
  );

  const reset = useCallback(() => {
    clear();
    setActiveIndex(-1);
  }, [clear]);

  return {
    activeIndex,
    isLoading: state.status === "loading",
    query: state.term,
    reset,
    results,
    setActiveIndex,
    setQuery,
    totalItems:
      (results?.collections.length ?? 0) +
      (results?.products.length ?? 0) +
      (results?.queries.length ?? 0),
  };
}
