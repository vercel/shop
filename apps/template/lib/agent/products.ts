import type { Money, ProductCard, ProductDetails, ProductVariant } from "../types";

export interface AgentProduct {
  available: boolean;
  compareAtPrice: Money | null;
  handle: string;
  image: string | null;
  price: Money;
  title: string;
  vendor: string | null;
}

export interface AgentVariant {
  available: boolean;
  id: string;
  options: { name: string; value: string }[];
  price: Money;
  requiresComponents: boolean;
  title: string;
}

export interface AgentProductDetails extends AgentProduct {
  description: string;
  images: string[];
  options: { name: string; values: string[] }[];
  variants: AgentVariant[];
}

// Shopify returns a zero-amount compare-at for undiscounted products; only a real markdown counts.
function toDiscountPrice(price: Money, compareAtPrice: Money | undefined): Money | null {
  if (!compareAtPrice) return null;
  return Number(compareAtPrice.amount) > Number(price.amount) ? compareAtPrice : null;
}

export function toAgentProduct(product: ProductCard): AgentProduct {
  return {
    available: product.availableForSale,
    compareAtPrice: toDiscountPrice(product.price, product.compareAtPrice),
    handle: product.handle,
    image: product.featuredImage?.url ?? null,
    price: product.price,
    title: product.title,
    vendor: product.vendor ?? null,
  };
}

function toAgentVariant(variant: ProductVariant): AgentVariant {
  return {
    available: variant.availableForSale,
    id: variant.id,
    options: variant.selectedOptions.map((option) => ({
      name: option.name,
      value: option.value,
    })),
    price: variant.price,
    requiresComponents: variant.requiresComponents,
    title: variant.title,
  };
}

export function toAgentProductDetails(product: ProductDetails): AgentProductDetails {
  return {
    ...toAgentProduct(product),
    description: product.description,
    images: product.images.map((image) => image.url),
    options: product.options.map((option) => ({
      name: option.name,
      values: option.values.map((value) => value.name),
    })),
    variants: (product.variants ?? []).map(toAgentVariant),
  };
}
