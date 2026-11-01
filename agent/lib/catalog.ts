import type { ToolModelOutput } from "eve/tools";
import { z } from "zod";

import { toAgentProduct } from "../../lib/agent/products";
import type { AgentProduct, AgentProductDetails } from "../../lib/agent/products/types";
import { formatPrice, fromMinorUnits } from "../../lib/money";
import type { ProductCard } from "../../lib/product/types";
import type { CatalogMoney, CatalogProduct } from "../../lib/shopify/catalog/types";
import { fetchProductOptionValues } from "../../lib/shopify/operations/products/server";

function toModelProduct({ available, compareAtPrice, handle, price, title, vendor }: AgentProduct) {
  return { available, compareAtPrice, handle, price, title, vendor };
}

export function toModelProducts(
  output: { error: string } | { products: AgentProduct[] },
): ToolModelOutput {
  if (!("products" in output)) return { type: "json", value: output };
  return { type: "json", value: { products: output.products.map(toModelProduct) } };
}

export function toModelProductDetails(
  output: { error: string } | { product: AgentProductDetails },
): ToolModelOutput {
  if (!("product" in output)) return { type: "json", value: output };
  const { description, options, variants } = output.product;
  const variantsComplete = output.product.variantsComplete === true && Boolean(variants?.length);
  return {
    type: "json",
    value: {
      product: {
        ...toModelProduct(output.product),
        description,
        options: options.map((option) => ({
          name: option.name,
          values: option.values.map((value) => value.name),
        })),
        variantsComplete,
        ...(variantsComplete && variants
          ? {
              variants: variants.map(
                ({
                  available,
                  compareAtPrice,
                  id,
                  price,
                  requiresBundleConfiguration,
                  requiresSellingPlan,
                  title,
                }) => ({
                  available,
                  compareAtPrice,
                  id,
                  price,
                  requiresBundleConfiguration,
                  requiresSellingPlan,
                  title,
                }),
              ),
            }
          : {}),
      },
    },
  };
}

export const productHandleSchema = z
  .string()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
  .max(255);

export const productOptionsSchema = z
  .array(
    z.strictObject({
      name: z
        .string()
        .max(100)
        .describe("A product option the shopper explicitly requested, such as Color or Size."),
      value: z
        .string()
        .max(100)
        .describe(
          "The product's own value for what the shopper asked, as results list it, such as LG for large; never a default variant value.",
        ),
    }),
  )
  .max(10)
  .default([])
  .describe(
    "Only product-option constraints explicitly requested by the shopper. Use [] when none were requested. Never include country, language, locale, or currency: the storefront applies commerce context automatically.",
  );

export async function matchingProducts(
  products: ProductCard[],
  options: { name: string; value: string }[],
) {
  if (!options.length || !products.length) return products.slice(0, 12).map(toAgentProduct);
  const values = await fetchProductOptionValues(products.map((product) => product.id));
  return products
    .filter((product) =>
      options.every((option) =>
        values.get(product.handle)?.get(option.name.toLowerCase())?.has(option.value.toLowerCase()),
      ),
    )
    .slice(0, 12)
    .map(toAgentProduct);
}

function formatCatalogMoney(money: CatalogMoney | null) {
  return money ? formatPrice(fromMinorUnits(money.amount, money.currency)) : null;
}

export function toCatalogCandidate(product: CatalogProduct) {
  const markedDown =
    product.listPrice && product.price && product.listPrice.amount > product.price.amount;
  return {
    available: product.variants.some((variant) => variant.available === true),
    collections: product.collections,
    compareAtPrice: markedDown ? formatCatalogMoney(product.listPrice) : null,
    handle: product.handle,
    id: product.id,
    options: product.options,
    price: formatCatalogMoney(product.price),
    title: product.title,
    variants: product.variants.map((variant) => ({
      available: variant.available,
      options: variant.options.map((option) => option.label).join(" / "),
    })),
  };
}
