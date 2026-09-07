import { gql } from "@shopify/hydrogen";
import { cacheLife, cacheTag } from "next/cache";

import type { ShopPolicy } from "@/lib/content/types";
import { defaultLocale } from "@/lib/i18n";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { SHOP_POLICY_FRAGMENT } from "@/lib/shopify/fragments/policies";
import { storefront } from "@/lib/shopify/storefront/server";
import type { ShopifyLocale } from "@/lib/shopify/storefront/types";

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
}: { locale?: ShopifyLocale } = {}): Promise<ShopPolicy[]> {
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
  locale?: ShopifyLocale;
}): Promise<ShopPolicy | undefined> {
  const policies = await getShopPolicies({ locale });
  return policies.find((policy) => policy.handle === handle);
}
