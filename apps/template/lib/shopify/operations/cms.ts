import { cacheLife, cacheTag } from "next/cache";
import type {
  CmsRichText,
  ContentSection,
  HeroSection,
  Homepage,
  LocalizedSlugs,
  MarketingImage,
  MarketingPage,
  ProductCard,
} from "@/lib/types";
import {
  defaultLocale,
  getCountryCode,
  getLanguageCode,
  locales,
} from "@/lib/i18n";
import {
  normalizeBlockType,
  parseJson,
  transformMediaImage,
} from "../transforms/cms";
import {
  type ShopifyCategoryProduct,
  transformShopifyProductCard,
} from "../transforms/product";

import { CATEGORY_PRODUCT_FRAGMENT } from "../fragments";
import { shopifyFetch } from "../client";

const REFERENCES_FIRST = 50;
const PRODUCTS_FIRST = 20;

interface MetaobjectField {
  key: string;
  type: string;
  value: string | null;
  reference: MetafieldReference | null;
  references: { nodes: MetafieldReference[] } | null;
}

interface Metaobject {
  __typename?: "Metaobject";
  id: string;
  handle: string;
  type: string;
  updatedAt: string;
  fields: MetaobjectField[];
}

interface ShopifyMediaImage {
  __typename: "MediaImage";
  image: {
    url: string;
    altText: string | null;
    width: number;
    height: number;
  } | null;
}

interface ShopifyCollectionReference {
  __typename: "Collection";
  handle: string;
  products: { edges: Array<{ node: ShopifyCategoryProduct }> };
}

interface ShopifyProductReference extends ShopifyCategoryProduct {
  __typename: "Product";
}

type MetafieldReference =
  | Metaobject
  | ShopifyMediaImage
  | ShopifyCollectionReference
  | ShopifyProductReference;

const CMS_METAOBJECT_QUERY = `
  ${CATEGORY_PRODUCT_FRAGMENT}
  query getCmsMetaobject(
    $handle: String!
    $type: String!
    $referencesFirst: Int!
    $productsFirst: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    metaobject(handle: { handle: $handle, type: $type }) {
      ...CmsMetaobjectFields
    }
  }

  fragment CmsMetaobjectFields on Metaobject {
    id
    handle
    type
    updatedAt
    fields {
      key
      type
      value
      reference {
        __typename
        ... on MediaImage {
          image {
            ...ImageFields
          }
        }
        ... on Collection {
          handle
          products(first: $productsFirst) {
            edges {
              node {
                ...CategoryProductFields
              }
            }
          }
        }
        ... on Metaobject {
          ...CmsNestedMetaobjectFields
        }
      }
      references(first: $referencesFirst) {
        nodes {
          __typename
          ... on Product {
            ...CategoryProductFields
          }
          ... on Collection {
            handle
            products(first: $productsFirst) {
              edges {
                node {
                  ...CategoryProductFields
                }
              }
            }
          }
          ... on MediaImage {
            image {
              ...ImageFields
            }
          }
          ... on Metaobject {
            ...CmsNestedMetaobjectFields
          }
        }
      }
    }
  }

  fragment CmsNestedMetaobjectFields on Metaobject {
    id
    handle
    type
    updatedAt
    fields {
      key
      type
      value
      reference {
        __typename
        ... on MediaImage {
          image {
            ...ImageFields
          }
        }
        ... on Collection {
          handle
          products(first: $productsFirst) {
            edges {
              node {
                ...CategoryProductFields
              }
            }
          }
        }
      }
      references(first: $referencesFirst) {
        nodes {
          __typename
          ... on Product {
            ...CategoryProductFields
          }
          ... on Collection {
            handle
            products(first: $productsFirst) {
              edges {
                node {
                  ...CategoryProductFields
                }
              }
            }
          }
          ... on MediaImage {
            image {
              ...ImageFields
            }
          }
        }
      }
    }
  }
`;

const CMS_PAGE_SLUGS_QUERY = `
  query getCmsPageSlugs($type: String!, $first: Int!) {
    metaobjects(type: $type, first: $first) {
      nodes {
        id
        handle
        fields {
          key
          value
        }
      }
    }
  }
`;

function mapFields(fields: MetaobjectField[]): Record<string, MetaobjectField> {
  return Object.fromEntries(fields.map((field) => [field.key, field]));
}

function isMetaobject(reference: MetafieldReference): reference is Metaobject {
  return (reference as Metaobject).fields !== undefined;
}

function isMediaImage(
  reference: MetafieldReference,
): reference is ShopifyMediaImage {
  return "__typename" in (reference as { __typename?: string })
    ? (reference as { __typename?: string }).__typename === "MediaImage"
    : false;
}

function isProduct(
  reference: MetafieldReference,
): reference is ShopifyProductReference {
  return "__typename" in (reference as { __typename?: string })
    ? (reference as { __typename?: string }).__typename === "Product"
    : false;
}

function isCollection(
  reference: MetafieldReference,
): reference is ShopifyCollectionReference {
  return "__typename" in (reference as { __typename?: string })
    ? (reference as { __typename?: string }).__typename === "Collection"
    : false;
}

function extractProducts(
  nodes: MetafieldReference[] | null | undefined,
): ProductCard[] | [] {
  if (!nodes) return [];
  return nodes
    .filter(isProduct)
    .map((product) => transformShopifyProductCard(product));
}

function extractMedia(
  nodes: MetafieldReference[] | null | undefined,
): MarketingImage[] {
  if (!nodes) return [];
  return nodes
    .filter(isMediaImage)
    .map((media) => transformMediaImage(media))
    .filter((img): img is NonNullable<typeof img> => img !== null);
}

function extractCollectionProducts(
  reference: MetafieldReference | null | undefined,
): ProductCard[] {
  if (!reference || !isCollection(reference)) return [];
  return reference.products.edges.map((edge) =>
    transformShopifyProductCard(edge.node),
  );
}

function transformHero(
  reference: MetafieldReference | null,
): HeroSection | null {
  if (!reference || !isMetaobject(reference)) return null;
  const fields = mapFields(reference.fields);
  const backgroundRef = fields.background_image?.reference ?? null;
  const backgroundImage =
    backgroundRef && isMediaImage(backgroundRef)
      ? transformMediaImage(backgroundRef)
      : null;

  return {
    id: reference.id,
    headline: fields.headline?.value ?? "",
    subheadline: fields.subheadline?.value ?? null,
    backgroundImage,
    ctaText: fields.cta_text?.value ?? null,
    ctaLink: fields.cta_link?.value ?? null,
  };
}

function transformSection(metaobject: Metaobject): ContentSection {
  const fields = mapFields(metaobject.fields);
  const blockType = normalizeBlockType(fields.block_type?.value ?? null);
  const title = fields.title?.value ?? null;
  const content = parseJson<CmsRichText>(fields.content?.value ?? null);
  const media = extractMedia(fields.media?.references?.nodes ?? []);
  const products = extractProducts(fields.products?.references?.nodes ?? []);
  const collectionProducts = extractCollectionProducts(
    fields.collection?.reference,
  );
  const settings =
    parseJson<Record<string, unknown>>(fields.settings?.value) ?? {};

  return {
    id: metaobject.id,
    blockType,
    title,
    content,
    media,
    products,
    collectionProducts,
    settings,
  };
}

function buildAlternates(
  nodes: MetafieldReference[] | null | undefined,
): LocalizedSlugs {
  const alternates = Object.fromEntries(
    locales.map((locale) => [locale, null]),
  ) as LocalizedSlugs;

  if (!nodes) return alternates;

  for (const node of nodes) {
    if (!isMetaobject(node)) continue;
    const fields = mapFields(node.fields);
    const locale = fields.locale?.value;
    const slug = fields.slug?.value;
    if (
      locale &&
      slug &&
      locales.includes(locale as (typeof locales)[number])
    ) {
      alternates[locale as (typeof locales)[number]] = slug;
    }
  }

  return alternates;
}

function extractSlugFromHandle(handle: string): string {
  const [slug] = handle.split("--");
  return slug || handle;
}

function transformMarketingPage(metaobject: Metaobject): MarketingPage {
  const fields = mapFields(metaobject.fields);
  const slug = fields.slug?.value ?? extractSlugFromHandle(metaobject.handle);
  const locale = fields.locale?.value ?? defaultLocale;
  const heroSection = transformHero(fields.hero?.reference ?? null);

  const sections = (fields.sections?.references?.nodes ?? [])
    .filter(isMetaobject)
    .map(transformSection);

  const alternates = buildAlternates(fields.alternates?.references?.nodes);

  return {
    id: metaobject.id,
    locale,
    slug,
    title: fields.title?.value ?? "",
    metaTitle: fields.meta_title?.value ?? null,
    metaDescription: fields.meta_description?.value ?? null,
    alternates,
    heroSection,
    sections,
    publishedAt: metaobject.updatedAt,
  };
}

function transformHomepage(metaobject: Metaobject): Homepage {
  const fields = mapFields(metaobject.fields);
  const heroSection = transformHero(fields.hero?.reference ?? null);

  const sections = (fields.sections?.references?.nodes ?? [])
    .filter(isMetaobject)
    .map(transformSection);

  return {
    id: metaobject.id,
    title: fields.title?.value ?? "",
    metaTitle: fields.meta_title?.value ?? null,
    metaDescription: fields.meta_description?.value ?? null,
    heroSection,
    sections,
    publishedAt: metaobject.updatedAt,
  };
}

async function fetchCmsMetaobject(
  handle: string,
  type: string,
  locale: string,
) {
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);
  const data = await shopifyFetch<{ metaobject: Metaobject | null }>({
    operation: "getCmsMetaobject",
    query: CMS_METAOBJECT_QUERY,
    variables: {
      handle,
      type,
      referencesFirst: REFERENCES_FIRST,
      productsFirst: PRODUCTS_FIRST,
      country,
      language,
    },
  });

  return data.metaobject;
}

export async function getHomepage(locale: string): Promise<Homepage | null> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("cms:all", "cms:homepage");

  const handle = `homepage--${locale}`;
  const metaobject = await fetchCmsMetaobject(handle, "cms_homepage", locale);
  if (metaobject) {
    return transformHomepage(metaobject);
  }

  const fallbackHandle = `homepage--${defaultLocale}`;
  const fallback = await fetchCmsMetaobject(
    fallbackHandle,
    "cms_homepage",
    defaultLocale,
  );
  return fallback ? transformHomepage(fallback) : null;
}

export async function getMarketingPage(
  slug: string,
  locale: string,
): Promise<MarketingPage | null> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("cms:all", "cms:pages", `cms:page:${slug}`);

  const handle = `${slug}--${locale}`;
  const metaobject = await fetchCmsMetaobject(handle, "cms_page", locale);
  if (!metaobject) return null;
  return transformMarketingPage(metaobject);
}

const CMS_PAGE_SLUGS_LIMIT = 250;

export interface LocaleSlugPair {
  locale: string;
  slug: string;
}

export async function getAllMarketingPageSlugs(): Promise<LocaleSlugPair[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("cms:all", "cms:pages");

  const data = await shopifyFetch<{ metaobjects: { nodes: Metaobject[] } }>({
    operation: "getCmsPageSlugs",
    query: CMS_PAGE_SLUGS_QUERY,
    variables: {
      type: "cms_page",
      first: CMS_PAGE_SLUGS_LIMIT,
    },
  });

  return data.metaobjects.nodes
    .map((metaobject) => {
      const fields = mapFields(metaobject.fields);
      const slug =
        fields.slug?.value ?? extractSlugFromHandle(metaobject.handle);
      const locale = fields.locale?.value ?? defaultLocale;
      return { slug, locale };
    })
    .filter((pair) => pair.slug && pair.locale);
}
