import type { ShopifyCollection } from "@/lib/shopify/transforms/collection/types";
import type { Collection } from "@/lib/types";

export function transformShopifyCollection(collection: ShopifyCollection): Collection {
  return {
    handle: collection.handle,
    id: collection.id,
    title: collection.title,
    description: collection.description,
    image: collection.image
      ? {
          url: collection.image.url,
          altText: collection.image.altText ?? collection.title,
          width: collection.image.width ?? 0,
          height: collection.image.height ?? 0,
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
