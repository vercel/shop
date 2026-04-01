import { tool } from "ai";
import { z } from "zod";

import { commerce } from "@/lib/commerce";

import { getAgentContext } from "../context";

export function createCommerceTools() {
  return {
    searchProducts: tool({
      description: `Search for products by keyword. Use this when the user asks to find products, is looking for something specific, or wants to browse by search query.
Returns a list of matching products with titles, prices, and availability.`,
      inputSchema: z.object({
        query: z.string().describe("Search query (e.g. 'blue jacket', 'wireless speaker')"),
        sortKey: z
          .enum(["best-matches", "price-low-to-high", "price-high-to-low"])
          .default("best-matches")
          .describe("How to sort results"),
        limit: z
          .number()
          .min(1)
          .max(10)
          .default(5)
          .describe("Number of results to return (max 10)"),
      }),
      execute: async ({ query, sortKey, limit }) => {
        const { user } = getAgentContext();

        try {
          const { products, total } = await commerce.products.getProducts({
            query,
            sortKey,
            limit,
            locale: user.locale,
          });

          return {
            success: true,
            total,
            products: products.map((p) => ({
              title: p.title,
              handle: p.handle,
              price: `${p.price.amount} ${p.price.currencyCode}`,
              compareAtPrice: p.compareAtPrice
                ? `${p.compareAtPrice.amount} ${p.compareAtPrice.currencyCode}`
                : null,
              available: p.availableForSale,
              vendor: p.vendor,
              image: p.featuredImage?.url ?? null,
            })),
          };
        } catch (error) {
          console.error("Failed to search products:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to search products",
          };
        }
      },
    }),

    getProductDetails: tool({
      description: `Get detailed information about a specific product by its handle.
Use this when the user asks about a product's details, variants, pricing, or availability.
The handle is the URL-friendly product identifier (e.g. "technest-smart-speaker-pro-jk0c").
You can get handles from search results or the current page context.`,
      inputSchema: z.object({
        handle: z
          .string()
          .describe("The product handle (URL slug) from search results or page context"),
      }),
      execute: async ({ handle }) => {
        const { user } = getAgentContext();

        try {
          const product = await commerce.products.getProduct(handle, user.locale);

          return {
            success: true,
            product: {
              title: product.title,
              handle: product.handle,
              description: product.description,
              price: `${product.price.amount} ${product.price.currencyCode}`,
              compareAtPrice: product.compareAtPrice
                ? `${product.compareAtPrice.amount} ${product.compareAtPrice.currencyCode}`
                : null,
              available: product.availableForSale,
              vendor: product.vendor,
              tags: product.tags,
              images: product.images.map((img) => img.url),
              variants: product.variants.map((v) => ({
                id: v.id,
                title: v.title,
                available: v.availableForSale,
                price: `${v.price.amount} ${v.price.currencyCode}`,
                options: v.selectedOptions.map((o) => `${o.name}: ${o.value}`).join(", "),
              })),
              options: product.options.map((o) => ({
                name: o.name,
                values: o.values.map((v) => v.name),
              })),
            },
          };
        } catch (error) {
          console.error("Failed to get product details:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get product details",
          };
        }
      },
    }),

    getProductRecommendations: tool({
      description: `Get product recommendations for a given product.
Use this when the user asks "what goes well with this?" or wants similar/related products.
Returns related product recommendations.`,
      inputSchema: z.object({
        handle: z.string().describe("The product handle to get recommendations for"),
      }),
      execute: async ({ handle }) => {
        const { user } = getAgentContext();

        try {
          const recommendations = await commerce.products.getProductRecommendations(
            handle,
            user.locale,
          );

          return {
            success: true,
            products: recommendations.slice(0, 5).map((p) => ({
              title: p.title,
              handle: p.handle,
              price: `${p.price.amount} ${p.price.currencyCode}`,
              available: p.availableForSale,
              image: p.featuredImage?.url ?? null,
            })),
          };
        } catch (error) {
          console.error("Failed to get recommendations:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get recommendations",
          };
        }
      },
    }),

    listCollections: tool({
      description: `List all available product collections/categories in the store.
Use this when the user asks "what categories do you have?", "show me your departments", or wants to browse by category.`,
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const { user } = getAgentContext();
          const collections = await commerce.collections.getCollections(user.locale);

          return {
            success: true,
            collections: collections.map((c) => ({
              title: c.title,
              handle: c.handle,
              description: c.description,
            })),
          };
        } catch (error) {
          console.error("Failed to list collections:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to list collections",
          };
        }
      },
    }),

    browseCollection: tool({
      description: `Browse products in a specific collection/category.
Use this when the user wants to see products in a particular category.
Get collection handles from the listCollections tool or the current page context.`,
      inputSchema: z.object({
        collection: z.string().describe("The collection handle (e.g. 'electronics', 'clothing')"),
        sortKey: z
          .enum([
            "best-matches",
            "price-low-to-high",
            "price-high-to-low",
            "BEST_SELLING",
            "CREATED",
          ])
          .default("best-matches")
          .describe("How to sort results"),
        limit: z
          .number()
          .min(1)
          .max(10)
          .default(5)
          .describe("Number of products to return (max 10)"),
      }),
      execute: async ({ collection, sortKey, limit }) => {
        const { user } = getAgentContext();

        try {
          const { products, pageInfo } = await commerce.products.getCollectionProducts({
            collection,
            sortKey,
            limit,
            locale: user.locale,
          });

          return {
            success: true,
            hasMore: pageInfo.hasNextPage,
            products: products.map((p) => ({
              title: p.title,
              handle: p.handle,
              price: `${p.price.amount} ${p.price.currencyCode}`,
              compareAtPrice: p.compareAtPrice
                ? `${p.compareAtPrice.amount} ${p.compareAtPrice.currencyCode}`
                : null,
              available: p.availableForSale,
              vendor: p.vendor,
              image: p.featuredImage?.url ?? null,
            })),
          };
        } catch (error) {
          console.error("Failed to browse collection:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to browse collection",
          };
        }
      },
    }),

    addToCart: tool({
      description: `Add a product variant to the cart.

IMPORTANT: You must use the variant_id, NOT the product_id.
When the user is on a product page, the available variant IDs are provided in the context.
If there are multiple variants (sizes, colors), ask the user which one they want before calling this tool.`,
      inputSchema: z.object({
        variant_id: z
          .string()
          .describe(
            "The product variant ID. Get this from the product context.",
          ),
        quantity: z
          .number()
          .min(1)
          .max(99)
          .default(1)
          .describe("Quantity to add (defaults to 1)"),
      }),
      execute: async ({ variant_id, quantity }) => {
        const { cart: cartId, page, user } = getAgentContext();

        if (!cartId) {
          return {
            success: false,
            error: "Cart not initialized. Please try again.",
          };
        }

        try {
          const updatedCart = await commerce.cart.addToCart(
            [{ merchandiseId: variant_id, quantity }],
            cartId,
            user.locale,
          );

          let productInfo = "";
          if (page?.type === "product") {
            const { product } = page;
            const variant = product.variants.find((v) => v.id === variant_id);
            if (variant) {
              productInfo = ` (${product.title} - ${variant.title})`;
            }
          }

          return {
            success: true,
            message: `Added ${quantity}x${productInfo} to cart`,
            cart: updatedCart,
          };
        } catch (error) {
          console.error("Failed to add product to cart:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to add product to cart",
          };
        }
      },
    }),

    getCart: tool({
      description: `View the current shopping cart contents.
Use this when the user asks "what's in my cart?", "how much is my order?", or when you need to look up line item IDs for updating/removing items.`,
      inputSchema: z.object({}),
      execute: async () => {
        const { cart: cartId } = getAgentContext();

        if (!cartId) {
          return {
            success: true,
            empty: true,
            message: "Cart is empty",
            items: [],
          };
        }

        try {
          const cart = await commerce.cart.getCart(cartId);

          if (!cart || cart.lines.length === 0) {
            return {
              success: true,
              empty: true,
              message: "Cart is empty",
              items: [],
            };
          }

          return {
            success: true,
            empty: false,
            totalQuantity: cart.totalQuantity,
            subtotal: `${cart.cost.subtotalAmount.amount} ${cart.cost.subtotalAmount.currencyCode}`,
            total: `${cart.cost.totalAmount.amount} ${cart.cost.totalAmount.currencyCode}`,
            tax: `${cart.cost.totalTaxAmount.amount} ${cart.cost.totalTaxAmount.currencyCode}`,
            note: cart.note,
            checkoutUrl: cart.checkoutUrl,
            items: cart.lines.map((line) => ({
              lineId: line.id,
              productTitle: line.merchandise.product.title,
              variantTitle: line.merchandise.title,
              image: line.merchandise.product.featuredImage?.url ?? null,
              options: line.merchandise.selectedOptions
                .map((o) => `${o.name}: ${o.value}`)
                .join(", "),
              quantity: line.quantity,
              totalPrice: `${line.cost.totalAmount.amount} ${line.cost.totalAmount.currencyCode}`,
              handle: line.merchandise.product.handle,
              merchandiseId: line.merchandise.id,
            })),
            cart,
          };
        } catch (error) {
          console.error("Failed to get cart:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get cart",
          };
        }
      },
    }),

    updateCartItemQuantity: tool({
      description: `Update the quantity of an item in the cart.
IMPORTANT: You must call getCart first to get the lineId and merchandiseId of the item to update.
Use the lineId from getCart results, not the product or variant ID.`,
      inputSchema: z.object({
        lineId: z
          .string()
          .describe(
            "The cart line item ID from getCart results",
          ),
        merchandiseId: z.string().describe("The merchandise/variant ID from getCart results"),
        quantity: z.number().min(1).max(99).describe("New quantity for the item"),
      }),
      execute: async ({ lineId, merchandiseId, quantity }) => {
        const { cart: cartId } = getAgentContext();

        if (!cartId) {
          return {
            success: false,
            error: "Cart not initialized. Please try again.",
          };
        }

        try {
          const updatedCart = await commerce.cart.updateCart(
            [{ id: lineId, merchandiseId, quantity }],
            cartId,
          );

          return {
            success: true,
            message: `Updated quantity to ${quantity}`,
            cart: updatedCart,
          };
        } catch (error) {
          console.error("Failed to update cart item:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update cart item",
          };
        }
      },
    }),

    removeFromCart: tool({
      description: `Remove an item from the cart.
IMPORTANT: You must call getCart first to get the lineId of the item to remove.
Use the lineId from getCart results, not the product or variant ID.`,
      inputSchema: z.object({
        lineId: z
          .string()
          .describe(
            "The cart line item ID from getCart results",
          ),
      }),
      execute: async ({ lineId }) => {
        const { cart: cartId } = getAgentContext();

        if (!cartId) {
          return {
            success: false,
            error: "Cart not initialized. Please try again.",
          };
        }

        try {
          const updatedCart = await commerce.cart.removeFromCart([lineId], cartId);

          return {
            success: true,
            message: "Item removed from cart",
            cart: updatedCart,
          };
        } catch (error) {
          console.error("Failed to remove from cart:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to remove item from cart",
          };
        }
      },
    }),

    addCartNote: tool({
      description: `Add or update a note on the cart. Use this for special instructions, gift messages, or delivery notes.`,
      inputSchema: z.object({
        note: z
          .string()
          .describe("The note to add to the cart (e.g. 'Please gift wrap this order')"),
      }),
      execute: async ({ note }) => {
        const { cart: cartId } = getAgentContext();

        if (!cartId) {
          return {
            success: false,
            error: "Cart not initialized. Please try again.",
          };
        }

        try {
          const updatedCart = await commerce.cart.updateCartNote(note, cartId);

          if (!updatedCart) {
            return {
              success: false,
              error: "Failed to update cart note",
            };
          }

          return {
            success: true,
            message: "Cart note updated",
            cart: updatedCart,
          };
        } catch (error) {
          console.error("Failed to add cart note:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to add cart note",
          };
        }
      },
    }),

    navigateUser: tool({
      description: `Generate a URL to navigate the user to a specific page on the site.
Use this when the user says "take me to...", "show me...", "go to...", or you want to direct them to a relevant page.
Returns a URL that the user can click to navigate.`,
      inputSchema: z.object({
        destination: z
          .enum([
            "product",
            "collection",
            "search",
            "cart",
            "account",
            "orders",
            "addresses",
            "checkout",
            "home",
          ])
          .describe("The type of page to navigate to"),
        identifier: z
          .string()
          .optional()
          .describe(
            "Product handle, collection handle, or search query (depending on destination)",
          ),
      }),
      execute: async ({ destination, identifier }) => {
        const urls: Record<string, { url: string; label: string }> = {
          home: { url: "/", label: "Home" },
          cart: { url: "/cart", label: "Shopping Cart" },
          account: { url: "/account/profile", label: "Your Profile" },
          orders: { url: "/account/orders", label: "Your Orders" },
          addresses: {
            url: "/account/addresses",
            label: "Your Addresses",
          },
        };

        if (destination === "product" && identifier) {
          return {
            success: true,
            url: `/products/${identifier}`,
            label: `View Product`,
          };
        }

        if (destination === "collection" && identifier) {
          return {
            success: true,
            url: `/collections/${identifier}`,
            label: `Browse Collection`,
          };
        }

        if (destination === "search") {
          const query = identifier ? `?q=${encodeURIComponent(identifier)}` : "";
          return {
            success: true,
            url: `/search${query}`,
            label: identifier ? `Search for "${identifier}"` : "Search",
          };
        }

        if (destination === "checkout") {
          return {
            success: true,
            url: "/cart",
            label: "Go to Cart to Checkout",
          };
        }

        const route = urls[destination];
        if (route) {
          return {
            success: true,
            ...route,
          };
        }

        return {
          success: false,
          error: `Unknown destination: ${destination}`,
        };
      },
    }),
  };
}
