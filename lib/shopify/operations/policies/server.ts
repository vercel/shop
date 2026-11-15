import { gql } from "@shopify/hydrogen";
import { z } from "zod";

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

const askResponseSchema = z.object({ answer: z.object({ plain: z.string() }) });

export async function fetchPolicyAnswer({
  context,
  profile,
  query,
}: {
  context: { country: string; language: string };
  profile: string;
  query: string;
}): Promise<string> {
  const result = await callShopifyMcpTool({
    args: {
      ask: { context: { address_country: context.country, language: context.language }, query },
      meta: { "ucp-agent": { profile } },
    },
    name: "ask_business",
  });
  return askResponseSchema.parse(result.structuredContent).answer.plain;
}
