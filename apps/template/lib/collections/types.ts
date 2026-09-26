import type { ProductFilter } from "@shopify/hydrogen";

import type { Facets } from "@/lib/filters/types";
import type { Image } from "@/lib/media/types";
import type { ProductPage } from "@/lib/product/types";
import type { SEO } from "@/lib/seo/types";

export interface BrowseState {
  dataSearch: string;
  filters: ProductFilter[];
  sort?: string;
}

// Collection products and the search index paginate with different Storefront cursors.
export type BrowseSource =
  | { collection: string; type: "collection" }
  | { collection?: string; query?: string; type: "search" };

export interface BrowseResults extends ProductPage {
  dataSearch: string;
  facets: Facets;
  source: BrowseSource;
  total?: number;
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
