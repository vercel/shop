import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { ContentPage } from "@/lib/types";

import { assertStorefrontOk } from "../errors";
import { storefront } from "../storefront";

interface ShopifyPage {
  body: string;
  bodySummary: string;
  handle: string;
  seo: {
    description: string | null;
    title: string | null;
  } | null;
  title: string;
  updatedAt: string;
}

const GET_PAGE_QUERY = `#graphql
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
` as const;

export async function getPage({
  handle,
  locale = defaultLocale,
}: {
  handle: string;
  locale?: string;
}): Promise<ContentPage | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("pages", `page-${handle}`);

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);
  const response = await storefront.request<{ page: ShopifyPage | null }>(GET_PAGE_QUERY, {
    variables: { country, handle, language },
  });
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
