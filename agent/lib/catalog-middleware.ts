import type { wrapLanguageModel } from "ai";

function isCatalogSearch(input: unknown): boolean {
  return (
    !!input &&
    typeof input === "object" &&
    "connection" in input &&
    input.connection === "shopify" &&
    "tool" in input &&
    input.tool === "search_catalog"
  );
}

export const catalogMiddleware = {
  async transformParams({ params }) {
    // Eve runs every connection tool as connection_execute, so only the paired call input names the catalog tool.
    const catalogSearchCallIds = new Set(
      params.prompt.flatMap((message) =>
        message.role === "assistant"
          ? message.content.flatMap((part) =>
              part.type === "tool-call" &&
              part.toolName === "connection_execute" &&
              isCatalogSearch(part.input)
                ? [part.toolCallId]
                : [],
            )
          : [],
      ),
    );
    if (!catalogSearchCallIds.size) return params;

    return {
      ...params,
      prompt: params.prompt.map((message) => {
        if (message.role !== "tool") return message;
        return {
          ...message,
          content: message.content.map((part) => {
            if (
              part.type !== "tool-result" ||
              !catalogSearchCallIds.has(part.toolCallId) ||
              part.output.type !== "json"
            )
              return part;
            const catalog = part.output.value;
            if (
              !catalog ||
              typeof catalog !== "object" ||
              Array.isArray(catalog) ||
              !("products" in catalog) ||
              !Array.isArray(catalog.products)
            )
              return part;
            return {
              ...part,
              output: {
                ...part.output,
                value: {
                  messages: catalog.messages ?? [],
                  pagination: catalog.pagination ?? null,
                  products: catalog.products.map((product) => {
                    if (!product || typeof product !== "object" || Array.isArray(product))
                      return product;
                    return {
                      categories: product.categories ?? [],
                      handle: product.handle ?? null,
                      id: product.id ?? null,
                      options: product.options ?? [],
                      price_range: product.price_range ?? null,
                      title: product.title ?? null,
                    };
                  }),
                },
              },
            };
          }),
        };
      }),
    };
  },
} satisfies Parameters<typeof wrapLanguageModel>[0]["middleware"];
