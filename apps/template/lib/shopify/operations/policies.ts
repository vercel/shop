import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { ShopPolicy } from "@/lib/types";

import { assertStorefrontOk } from "../errors";
import { storefront } from "../storefront";

const GET_SHOP_POLICIES_QUERY = `#graphql
  query getShopPolicies($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    shop {
      contactInformation {
        body
        handle
        title
      }
      legalNotice {
        body
        handle
        title
      }
      privacyPolicy {
        body
        handle
        title
      }
      refundPolicy {
        body
        handle
        title
      }
      shippingPolicy {
        body
        handle
        title
      }
      termsOfSale {
        body
        handle
        title
      }
      termsOfService {
        body
        handle
        title
      }
    }
  }
` as const;

type ShopifyPolicy = ShopPolicy | null | undefined;

interface ShopPoliciesResponse {
  shop: {
    contactInformation: ShopifyPolicy;
    legalNotice: ShopifyPolicy;
    privacyPolicy: ShopifyPolicy;
    refundPolicy: ShopifyPolicy;
    shippingPolicy: ShopifyPolicy;
    termsOfSale: ShopifyPolicy;
    termsOfService: ShopifyPolicy;
  };
}

export async function getShopPolicies({
  locale = defaultLocale,
}: { locale?: string } = {}): Promise<ShopPolicy[]> {
  "use cache";
  cacheLife("max");
  cacheTag("policies");

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);
  const response = await storefront.request<ShopPoliciesResponse>(GET_SHOP_POLICIES_QUERY, {
    variables: { country, language },
  });
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
