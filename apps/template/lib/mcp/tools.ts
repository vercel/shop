import { commerce } from "@/lib/commerce";

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export const mcpTools: McpToolDefinition[] = [
  {
    name: "search_products",
    description:
      "Search for products by keyword. Returns matching products with titles, prices, and availability.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query (e.g. 'blue jacket')" },
        sort_key: {
          type: "string",
          enum: ["best-matches", "price-low-to-high", "price-high-to-low"],
          default: "best-matches",
          description: "How to sort results",
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 50,
          default: 10,
          description: "Number of results to return",
        },
        locale: { type: "string", description: "Locale code (e.g. 'en-US')" },
      },
      required: ["query"],
    },
    execute: async (args) => {
      const { products, total } = await commerce.products.getProducts({
        query: args.query as string,
        sortKey: (args.sort_key as string) ?? "best-matches",
        limit: (args.limit as number) ?? 10,
        locale: args.locale as string | undefined,
      });
      return {
        total,
        products: products.map((p) => ({
          handle: p.handle,
          title: p.title,
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? null,
          availableForSale: p.availableForSale,
          vendor: p.vendor,
          featuredImage: p.featuredImage,
        })),
      };
    },
  },
  {
    name: "get_product",
    description:
      "Get detailed information about a specific product by its handle, including all variants, options, and images.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string", description: "The product handle (URL slug)" },
        locale: { type: "string", description: "Locale code" },
      },
      required: ["handle"],
    },
    execute: async (args) => {
      return commerce.products.getProduct(
        args.handle as string,
        args.locale as string | undefined,
      );
    },
  },
  {
    name: "get_product_recommendations",
    description: "Get product recommendations for a given product.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string", description: "The product handle" },
        locale: { type: "string", description: "Locale code" },
      },
      required: ["handle"],
    },
    execute: async (args) => {
      const recommendations = await commerce.products.getProductRecommendations(
        args.handle as string,
        args.locale as string | undefined,
      );
      return {
        products: recommendations.map((p) => ({
          handle: p.handle,
          title: p.title,
          price: p.price,
          availableForSale: p.availableForSale,
          featuredImage: p.featuredImage,
        })),
      };
    },
  },
  {
    name: "list_collections",
    description: "List all available product collections/categories in the store.",
    inputSchema: {
      type: "object",
      properties: {
        locale: { type: "string", description: "Locale code" },
      },
    },
    execute: async (args) => {
      const collections = await commerce.collections.getCollections(
        args.locale as string | undefined,
      );
      return {
        collections: collections.map((c) => ({
          handle: c.handle,
          title: c.title,
          description: c.description,
          path: c.path,
        })),
      };
    },
  },
  {
    name: "get_collection_products",
    description: "Get products from a specific collection with sorting and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection handle" },
        sort_key: {
          type: "string",
          enum: ["best-matches", "price-low-to-high", "price-high-to-low", "BEST_SELLING"],
          default: "best-matches",
        },
        limit: { type: "number", minimum: 1, maximum: 50, default: 10 },
        cursor: { type: "string", description: "Pagination cursor" },
        locale: { type: "string" },
      },
      required: ["collection"],
    },
    execute: async (args) => {
      const { products, pageInfo } = await commerce.products.getCollectionProducts({
        collection: args.collection as string,
        sortKey: (args.sort_key as string) ?? "best-matches",
        limit: (args.limit as number) ?? 10,
        cursor: args.cursor as string | undefined,
        locale: args.locale as string | undefined,
      });
      return {
        products: products.map((p) => ({
          handle: p.handle,
          title: p.title,
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? null,
          availableForSale: p.availableForSale,
          vendor: p.vendor,
          featuredImage: p.featuredImage,
        })),
        pageInfo,
      };
    },
  },
  {
    name: "predictive_search",
    description: "Autocomplete-style search returning products, collections, and query suggestions.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        locale: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 10, default: 4 },
      },
      required: ["query"],
    },
    execute: async (args) => {
      return commerce.search.predictiveSearch(
        args.query as string,
        args.locale as string | undefined,
        (args.limit as number) ?? 4,
      );
    },
  },
  {
    name: "get_cart",
    description: "Get cart contents by cart ID.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: { type: "string", description: "The cart ID" },
      },
      required: ["cart_id"],
    },
    execute: async (args) => {
      const cart = await commerce.cart.getCart(args.cart_id as string);
      if (!cart) return { error: "Cart not found" };
      return cart;
    },
  },
  {
    name: "create_cart",
    description: "Create a new cart. Returns the cart object with its ID.",
    inputSchema: {
      type: "object",
      properties: {
        locale: { type: "string", description: "Locale for currency/country" },
      },
    },
    execute: async (args) => {
      return commerce.cart.createCartWithoutCookie(args.locale as string | undefined);
    },
  },
  {
    name: "add_to_cart",
    description: "Add product variants to a cart.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: { type: "string", description: "The cart ID" },
        lines: {
          type: "array",
          items: {
            type: "object",
            properties: {
              merchandise_id: {
                type: "string",
                description: "Product variant ID from the commerce provider",
              },
              quantity: { type: "number", minimum: 1 },
            },
            required: ["merchandise_id", "quantity"],
          },
          description: "Items to add",
        },
        locale: { type: "string" },
      },
      required: ["cart_id", "lines"],
    },
    execute: async (args) => {
      const lines = (args.lines as Array<{ merchandise_id: string; quantity: number }>).map(
        (l) => ({
          merchandiseId: l.merchandise_id,
          quantity: l.quantity,
        }),
      );
      return commerce.cart.addToCart(
        lines,
        args.cart_id as string,
        args.locale as string | undefined,
      );
    },
  },
  {
    name: "update_cart",
    description: "Update line item quantities in a cart.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: { type: "string", description: "The cart ID" },
        lines: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Cart line ID" },
              merchandise_id: { type: "string", description: "Product variant ID" },
              quantity: { type: "number", minimum: 0 },
            },
            required: ["id", "merchandise_id", "quantity"],
          },
        },
      },
      required: ["cart_id", "lines"],
    },
    execute: async (args) => {
      const lines = (
        args.lines as Array<{ id: string; merchandise_id: string; quantity: number }>
      ).map((l) => ({
        id: l.id,
        merchandiseId: l.merchandise_id,
        quantity: l.quantity,
      }));
      return commerce.cart.updateCart(lines, args.cart_id as string);
    },
  },
  {
    name: "remove_from_cart",
    description: "Remove line items from a cart.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: { type: "string", description: "The cart ID" },
        line_ids: {
          type: "array",
          items: { type: "string" },
          description: "Cart line IDs to remove",
        },
      },
      required: ["cart_id", "line_ids"],
    },
    execute: async (args) => {
      return commerce.cart.removeFromCart(
        args.line_ids as string[],
        args.cart_id as string,
      );
    },
  },
  {
    name: "update_cart_note",
    description: "Add or update a note on a cart.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: { type: "string", description: "The cart ID" },
        note: { type: "string", description: "The note text" },
      },
      required: ["cart_id", "note"],
    },
    execute: async (args) => {
      const cart = await commerce.cart.updateCartNote(
        args.note as string,
        args.cart_id as string,
      );
      if (!cart) return { error: "Failed to update cart note" };
      return cart;
    },
  },
];
