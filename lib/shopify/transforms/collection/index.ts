import type { Collection } from "@/lib/collections/types";
import type { ShopifyCollection } from "@/lib/shopify/transforms/collection/types";

export function transformShopifyCollection(collection: ShopifyCollection): Collection {
  return {
    description: collection.description,
    handle: collection.handle,
    id: collection.id,
    image: collection.image
      ? {
          altText: collection.image.altText ?? collection.title,
          height: collection.image.height ?? 0,
          url: collection.image.url,
          width: collection.image.width ?? 0,
        }
      : null,
    path: `/collections/${collection.handle}`,
    seo: {
      description: collection.seo.description || collection.description,
      title: collection.seo.title || collection.title,
    },
    title: collection.title,
    updatedAt: collection.updatedAt,
  };
}

export function transformShopifyCollections(collections: ShopifyCollection[]): Collection[] {
  return collections.map(transformShopifyCollection);
}
