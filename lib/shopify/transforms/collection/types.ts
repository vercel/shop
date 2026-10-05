import type { COLLECTION_FIELDS_FRAGMENT } from "@/lib/shopify/fragments/collection";
import type { ResultOf } from "@/lib/shopify/types";

export type ShopifyCollection = ResultOf<typeof COLLECTION_FIELDS_FRAGMENT>;
