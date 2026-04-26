import type { Collection } from "@/lib/types";

interface ShopifyCollection {
  handle: string;
  title: string;
  description: string;
  image: {
    url: string;
    altText: string | null;
    width: number;
    height: number;
  } | null;
  updatedAt: string;
  seo: {
    title: string | null;
    description: string | null;
  };
}

export function transformShopifyCollection(collection: ShopifyCollection): Collection {
  return {
    handle: collection.handle,
    title: collection.title,
    description: collection.description,
    image: collection.image
      ? {
          url: collection.image.url,
          altText: collection.image.altText ?? collection.title,
          width: collection.image.width,
          height: collection.image.height,
        }
      : null,
    path: `/collections/${collection.handle}`,
    updatedAt: collection.updatedAt,
    seo: {
      title: collection.seo.title || collection.title,
      description: collection.seo.description || collection.description,
    },
  };
}

export function transformShopifyCollections(collections: ShopifyCollection[]): Collection[] {
  return collections.map(transformShopifyCollection);
}

export type { ShopifyCollection };
