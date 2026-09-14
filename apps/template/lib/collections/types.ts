import type { ProductFilter } from "@shopify/hydrogen";

import type { Filter, PriceRange } from "@/lib/filters/types";
import type { Image } from "@/lib/media/types";
import type { SEO } from "@/lib/seo/types";
import type { CollectionProductsResult } from "@/lib/shopify/operations/products/types";

export interface BrowseParams {
  filters: ProductFilter[];
  sort?: string;
}

export interface CollectionSearchState extends BrowseParams {
  dataSearch: string;
}

export interface CollectionResultsData extends BrowseParams {
  collection: string;
  dataSearch: string;
  result: CollectionProductsResult;
  transformedFilters: { filters: Filter[]; priceRange?: PriceRange };
}

export interface Collection {
  description: string;
  handle: string;
  id?: string;
  image?: Image | null;
  path: string;
  seo: SEO;
  title: string;
  updatedAt: string;
}

export interface CollectionWithThumbnail extends Collection {
  thumbnail: Image | null;
  thumbnailProductId: string | null;
}
