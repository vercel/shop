import type { Filter, PriceRange } from "@/lib/filters/types";
import type { Image } from "@/lib/media/types";
import type { SEO } from "@/lib/seo/types";
import type { fetchCollectionProducts } from "@/lib/shopify/operations/products/server";
import type { ProductFilter } from "@/lib/shopify/transforms/filters/types";

export type ActiveFilters = Record<string, string | string[] | undefined>;

export interface BrowseParams {
  activeFilters: ActiveFilters;
  filters: ProductFilter[];
  sort?: string;
}

export interface CollectionSearchState extends BrowseParams {
  dataSearch: string;
}

export interface CollectionResultsData extends BrowseParams {
  collection: string;
  dataSearch: string;
  result: Awaited<ReturnType<typeof fetchCollectionProducts>>;
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
}
