import { gql } from "@shopify/hydrogen";
import { cacheLife, cacheTag } from "next/cache";

import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import type { ContentPage } from "@/lib/content/types";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { storefront } from "@/lib/shopify/storefront/server";

const GET_PAGE_QUERY = gql(`#graphql
  query getPage($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    page(handle: $handle) {
      body
      bodySummary
      handle
      seo {
        description
        title
      }
      title
      updatedAt
    }
  }
`);

export async function getPage({
  handle,
  locale = shopConfig.localization,
}: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ContentPage | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("pages", `page-${handle}`);

  const response = await storefront.request(GET_PAGE_QUERY, { locale, variables: { handle } });
  assertStorefrontOk(response, "getPage");

  const page = response.data.page;
  if (!page) return undefined;

  return {
    body: page.body,
    handle: page.handle,
    seo: {
      description: page.seo?.description ?? page.bodySummary,
      title: page.seo?.title ?? page.title,
    },
    title: page.title,
    updatedAt: page.updatedAt,
  };
}
