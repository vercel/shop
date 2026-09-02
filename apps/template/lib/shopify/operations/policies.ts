import { gql } from "@shopify/hydrogen";
import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale } from "@/lib/i18n";
import type { ShopPolicy } from "@/lib/types";

import { assertStorefrontOk } from "../errors";
import { storefront } from "../storefront";

const SHOP_POLICY_FRAGMENT = gql(`#graphql
  fragment ShopPolicyFields on ShopPolicy {
    body
    handle
    title
  }
`);

const GET_SHOP_POLICIES_QUERY = gql(
  `#graphql
  query getShopPolicies($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    shop {
      contactInformation {
        ...ShopPolicyFields
      }
      legalNotice {
        ...ShopPolicyFields
      }
      privacyPolicy {
        ...ShopPolicyFields
      }
      refundPolicy {
        ...ShopPolicyFields
      }
      shippingPolicy {
        ...ShopPolicyFields
      }
      termsOfSale {
        ...ShopPolicyFields
      }
      termsOfService {
        ...ShopPolicyFields
      }
    }
  }
`,
  [SHOP_POLICY_FRAGMENT],
);

export async function getShopPolicies({
  locale = defaultLocale,
}: { locale?: string } = {}): Promise<ShopPolicy[]> {
  "use cache";
  cacheLife("max");
  cacheTag("policies");

  const response = await storefront.request(GET_SHOP_POLICIES_QUERY, { locale });
  assertStorefrontOk(response, "getShopPolicies");

  return Object.values(response.data.shop).filter(
    (policy): policy is ShopPolicy => policy !== null && policy !== undefined,
  );
}

export async function getShopPolicy({
  handle,
  locale = defaultLocale,
}: {
  handle: string;
  locale?: string;
}): Promise<ShopPolicy | undefined> {
  const policies = await getShopPolicies({ locale });
  return policies.find((policy) => policy.handle === handle);
}
