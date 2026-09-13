import type { Money } from "@/lib/money/types";
import { buildProductUrl, toSelectedOptionList } from "@/lib/product";
import type {
  OptionGroupState,
  ProductCard,
  ProductDetails,
  ProductVariant,
  SelectedOptions,
} from "@/lib/product/types";

import type { AgentProduct, AgentProductDetails, AgentVariant } from "./types";

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
    compareAtPrice: toDiscountPrice(variant.price, variant.compareAtPrice),
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
      values: option.values.map((value) => ({
        name: value.name,
        ...(value.image ? { image: value.image } : {}),
        ...(value.swatch ? { swatch: value.swatch } : {}),
      })),
    })),
    variants: (product.variants ?? []).map(toAgentVariant),
  };
}

export function findAgentVariant(
  product: AgentProductDetails,
  selected: SelectedOptions,
): AgentVariant | undefined {
  return product.variants.find((variant) =>
    variant.options.every((option) => selected[option.name] === option.value),
  );
}

function toSelection(variant: AgentVariant | undefined): SelectedOptions {
  return Object.fromEntries((variant?.options ?? []).map((option) => [option.name, option.value]));
}

export function defaultAgentSelection(product: AgentProductDetails): SelectedOptions {
  return toSelection(product.variants.find((variant) => variant.available) ?? product.variants[0]);
}

export function selectAgentOption(
  product: AgentProductDetails,
  selected: SelectedOptions,
  name: string,
  value: string,
): SelectedOptions {
  const next = { ...selected, [name]: value };
  if (findAgentVariant(product, next)) return next;
  const fallback = product.variants.find((variant) =>
    variant.options.some((option) => option.name === name && option.value === value),
  );
  return fallback ? toSelection(fallback) : next;
}

export function toAgentOptionGroups(
  product: AgentProductDetails,
  selected: SelectedOptions,
): OptionGroupState[] {
  return product.options.map((option) => ({
    name: option.name,
    values: option.values.map((value) => {
      const candidate = { ...selected, [option.name]: value.name };
      const variant = findAgentVariant(product, candidate);
      return {
        available: variant?.available ?? false,
        crossProduct: false,
        exists: Boolean(variant),
        href: buildProductUrl(product.handle, toSelectedOptionList(candidate)),
        image: value.image,
        name: value.name,
        selected: selected[option.name] === value.name,
        swatch: value.swatch,
      };
    }),
  }));
}
