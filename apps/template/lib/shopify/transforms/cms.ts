import type { ContentBlockType, MarketingImage } from "@/lib/types";

interface ShopifyMediaImage {
  image?: {
    url: string;
    altText?: string | null;
    width: number;
    height: number;
  } | null;
}

export function transformMediaImage(
  media: ShopifyMediaImage | null | undefined,
): MarketingImage | null {
  const image = media?.image;
  if (!image) return null;
  return {
    url: image.url,
    alt: image.altText ?? "",
    width: image.width,
    height: image.height,
  };
}

export function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function normalizeBlockType(
  value: string | null | undefined,
): ContentBlockType {
  if (value === "top-products") {
    return "products";
  }
  switch (value) {
    case "featured-products":
    case "promo-banner":
    case "rich-text":
    case "image-gallery":
    case "product-grid":
    case "products":
      return value;
    default:
      return "rich-text";
  }
}
