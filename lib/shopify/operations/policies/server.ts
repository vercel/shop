import { gql } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import type { ShopPolicy } from "@/lib/policies/types";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { SHOP_POLICY_FRAGMENT } from "@/lib/shopify/fragments/policies";
import { sanitizeShopifyHtml } from "@/lib/shopify/html/server";
import { callShopifyMcpTool } from "@/lib/shopify/mcp/server";
import { storefront } from "@/lib/shopify/storefront/server";

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

export async function fetchShopPolicies({
  locale = shopConfig.localization,
}: {
  locale?: CommerceLocale;
} = {}): Promise<ShopPolicy[]> {
  const response = await storefront.request(GET_SHOP_POLICIES_QUERY, { locale });
  assertStorefrontOk(response, "getShopPolicies");

  return Object.values(response.data.shop)
    .filter((policy): policy is ShopPolicy => policy !== null && policy !== undefined)
    .map((policy) => ({ ...policy, body: sanitizeShopifyHtml(policy.body) }));
}

export const POLICY_TYPES = [
  "contact",
  "legal_notice",
  "privacy",
  "refund",
  "shipping",
  "subscription",
  "terms_of_sale",
  "terms_of_service",
] as const;

export async function fetchPolicyAnswers({
  policyTypes,
  query,
}: {
  policyTypes?: readonly (typeof POLICY_TYPES)[number][];
  query: string;
}): Promise<unknown> {
  const result = await callShopifyMcpTool({
    args: { query, ...(policyTypes?.length ? { policy_types: policyTypes } : {}) },
    name: "search_shop_policies_and_faqs",
    path: "/api/mcp",
  });
  if (result.structuredContent !== undefined) return result.structuredContent;
  const text = result.content?.flatMap((part) => (part.text ? [part.text] : [])).join("\n") ?? "";
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
