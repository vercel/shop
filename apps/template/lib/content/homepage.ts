import type { ContentSection, Homepage, MarketingImage } from "@/lib/types";
import {
  getCollectionProducts,
  getProducts,
} from "@/lib/shopify/operations/products";

import { createRichTextDocument } from "@/lib/content/rich-text";
import { getCollections } from "@/lib/shopify/operations/collections";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/config";

const DEFAULT_PUBLISHED_AT = "2025-01-01T00:00:00.000Z";
const FEATURED_COLLECTION_HANDLE = "furniture";
const DEFAULT_HERO_IMAGE: MarketingImage = {
  alt: siteConfig.name,
  height: 630,
  url: "/og-default.png",
  width: 1200,
};

function createRichTextSection(
  id: string,
  title: string,
  paragraphs: string[],
  settings: Record<string, unknown> = {},
): ContentSection {
  return {
    id,
    blockType: "rich-text",
    title,
    content: createRichTextDocument(paragraphs),
    media: [],
    products: [],
    settings,
  };
}

export async function getDefaultHomepage(locale: Locale): Promise<Homepage> {
  const [contentT, seoT, collections, featuredProductsResult] =
    await Promise.all([
      getTranslations({ locale, namespace: "content.homepage" }),
      getTranslations({ locale, namespace: "seo" }),
      getCollections(locale),
      getProducts({ limit: 10, locale }),
    ]);

  const featuredCollection =
    collections.find(
      (collection) => collection.handle === FEATURED_COLLECTION_HANDLE,
    ) ?? collections[0];
  const collectionProductsResult = featuredCollection
    ? await getCollectionProducts({
        collection: featuredCollection.handle,
        limit: 8,
        locale,
      })
    : null;
  const heroImage = featuredCollection?.image
    ? {
        url: featuredCollection.image.url,
        alt: featuredCollection.image.altText,
        width: featuredCollection.image.width,
        height: featuredCollection.image.height,
      }
    : featuredProductsResult.products[0]?.featuredImage
      ? {
          url: featuredProductsResult.products[0].featuredImage.url,
          alt:
            featuredProductsResult.products[0].featuredImage.altText ||
            featuredProductsResult.products[0].title,
          width: featuredProductsResult.products[0].featuredImage.width,
          height: featuredProductsResult.products[0].featuredImage.height,
        }
      : DEFAULT_HERO_IMAGE;

  const sections: ContentSection[] = [
    createRichTextSection(
      "home-intro",
      contentT("intro.title"),
      [contentT("intro.paragraphOne"), contentT("intro.paragraphTwo")],
      { layout: "split-intro" },
    ),
  ];

  if (
    collectionProductsResult &&
    collectionProductsResult.products.length > 0
  ) {
    sections.push({
      id: "home-featured-collection",
      blockType: "product-grid",
      title: contentT("featuredCollection.title", {
        collectionTitle: featuredCollection?.title ?? "",
      }),
      content: null,
      media: [],
      products: [],
      collectionProducts: collectionProductsResult.products,
      settings: {
        limit: 8,
      },
    });
  }

  if (featuredProductsResult.products.length > 0) {
    sections.push({
      id: "home-featured-products",
      blockType: "products",
      title: contentT("featuredProducts.title"),
      content: null,
      media: [],
      products: featuredProductsResult.products,
      settings: {
        maxProducts: 10,
      },
    });
  }

  return {
    id: "default-homepage",
    title: seoT("homeTitle"),
    metaTitle: null,
    metaDescription: seoT("homeDescription"),
    heroSection: {
      id: "default-homepage-hero",
      headline: contentT("hero.headline", { storeName: siteConfig.name }),
      subheadline: contentT("hero.subheadline"),
      backgroundImage: heroImage,
      ctaText: contentT("hero.ctaText"),
      ctaLink: featuredCollection
        ? `/collections/${featuredCollection.handle}`
        : "/search",
    },
    sections,
    publishedAt: DEFAULT_PUBLISHED_AT,
  };
}
