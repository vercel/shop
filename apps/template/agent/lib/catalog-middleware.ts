import type { wrapLanguageModel } from "ai";

export const catalogMiddleware = {
  async transformParams({ params }) {
    return {
      ...params,
      prompt: params.prompt.map((message) => {
        if (message.role !== "tool") return message;
        return {
          ...message,
          content: message.content.map((part) => {
            if (
              part.type !== "tool-result" ||
              part.toolName !== "shopify__search_catalog" ||
              part.output.type !== "json"
            )
              return part;
            const output = part.output.value;
            if (!output || typeof output !== "object" || Array.isArray(output) || output.isError)
              return part;
            const catalog = output.structuredContent;
            if (
              !catalog ||
              typeof catalog !== "object" ||
              Array.isArray(catalog) ||
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
