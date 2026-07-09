import { cacheLife, cacheTag } from "next/cache";

import { assertStorefrontOk } from "../errors";
import { storefront } from "../storefront";

const GET_SHOP_ID_QUERY = `#graphql
  query getShopId {
    shop {
      id
    }
  }
` as const;

export async function getShopId(): Promise<string> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("shop");

  const response = await storefront.request<{ shop: { id: string } }>(GET_SHOP_ID_QUERY);
  assertStorefrontOk(response, "getShopId");
  return response.data.shop.id;
}
