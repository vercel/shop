import { z } from "zod";

import type { CatalogSearchResult } from "@/lib/shopify/catalog/types";
import { callShopifyMcpTool } from "@/lib/shopify/mcp/server";

const moneySchema = z.object({ amount: z.number(), currency: z.string() });

const catalogResponseSchema = z.object({
  messages: z.array(z.object({ content: z.string() })).optional(),
  pagination: z
    .object({ cursor: z.string().nullish(), has_next_page: z.boolean().optional() })
    .optional(),
  products: z.array(
    z.object({
      collections: z.array(z.object({ handle: z.string() })).optional(),
      handle: z.string(),
      id: z.string(),
      list_price_range: z.object({ min: moneySchema }).optional(),
      options: z
        .array(z.object({ name: z.string(), values: z.array(z.object({ label: z.string() })) }))
        .optional(),
      price_range: z.object({ min: moneySchema }).optional(),
      title: z.string(),
      variants: z
        .array(
          z.object({
            availability: z.object({ available: z.boolean() }).optional(),
            options: z.array(z.object({ label: z.string(), name: z.string() })).optional(),
          }),
        )
        .optional(),
    }),
  ),
});

export async function fetchCatalogSearch({
  context,
  cursor,
  filters = {},
  limit,
  profile,
  query,
}: {
  context: { country: string; currency?: string; language: string };
  cursor?: string;
  filters?: { available?: false; maxPrice?: number };
  limit: number;
  profile: string;
  query: string;
}): Promise<CatalogSearchResult> {
  const catalogFilters = {
    ...(filters.available === false ? { available: false } : {}),
    ...(filters.maxPrice === undefined ? {} : { price: { max: filters.maxPrice } }),
  };
  const catalog = {
    context: {
      address_country: context.country,
      language: context.language,
      ...(context.currency ? { currency: context.currency } : {}),
    },
    ...(Object.keys(catalogFilters).length ? { filters: catalogFilters } : {}),
    pagination: { limit, ...(cursor ? { cursor } : {}) },
    query,
  };

  const result = await callShopifyMcpTool({
    args: { catalog, meta: { "ucp-agent": { profile } } },
    name: "search_catalog",
    path: "/api/ucp/mcp",
  });
  const data = catalogResponseSchema.parse(result.structuredContent);

  return {
    cursor: data.pagination?.has_next_page ? (data.pagination.cursor ?? null) : null,
    messages: data.messages?.map((message) => message.content) ?? [],
    products: data.products.map((product) => ({
      collections: product.collections?.map((collection) => collection.handle) ?? [],
      handle: product.handle,
      id: product.id,
      listPrice: product.list_price_range?.min ?? null,
      options:
        product.options?.map((option) => ({
          name: option.name,
          values: option.values.map((value) => value.label),
        })) ?? [],
      price: product.price_range?.min ?? null,
      title: product.title,
      variants:
        product.variants?.map((variant) => ({
          available: variant.availability?.available ?? null,
          options: variant.options ?? [],
        })) ?? [],
    })),
  };
}
