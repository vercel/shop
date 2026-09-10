import {
  createCartCookie,
  createCartServerHandlers,
  createShopifyRequestContext,
} from "@shopify/hydrogen";
import { z } from "zod";

import { toAgentProduct, toAgentProductDetails } from "@/lib/agent/products";
import { shopConfig } from "@/lib/config";
import type { ProductCard } from "@/lib/product/types";
import {
  fetchCollections as getCollections,
  fetchCollectionProducts as getCollectionProducts,
  fetchComplementaryProducts as getComplementaryProducts,
  fetchProductOptionValues,
  fetchProductsByIds as getProductsByIds,
  fetchProductWithVariants as getProductWithVariants,
  fetchRelatedProducts as getRelatedProducts,
  fetchSearchIndexProducts as searchIndexProducts,
} from "@/lib/shopify/catalog/server";
import { CART_FRAGMENT } from "@/lib/shopify/fragments/cart";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront/server";

import { commerceSchemas } from "./index";

const cartHandlers = createCartServerHandlers({ fragment: CART_FRAGMENT });

async function getCartById(cartId: string | undefined) {
  if (!cartId) return undefined;
  const request = new Request(new URL("/api/cart", shopConfig.site.url), {
    headers: { cookie: createCartCookie(cartId).split(";")[0] },
  });
  const requestContext = createShopifyRequestContext({ i18n: shopConfig.localization, request });
  const storefrontClient = createRequestStorefrontClient(requestContext);
  const { data } = await cartHandlers.get({ request, storefrontClient });
  return data.cart ?? undefined;
}

async function matchingProducts(
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

export async function executeCommerce(
  tool: keyof typeof commerceSchemas,
  input: unknown,
  cartId?: string,
) {
  switch (tool) {
    case "present-products": {
      const { ids, options } = commerceSchemas[tool].parse(input);
      return {
        products: await matchingProducts(
          ids.length ? await getProductsByIds({ ids }) : [],
          options,
        ),
      };
    }
    case "search-products": {
      const { options, query, sortKey } = commerceSchemas[tool].parse(input);
      const { products } = await searchIndexProducts({
        limit: options.length ? 50 : 12,
        query,
        sortKey,
      });
      return { products: await matchingProducts(products, options) };
    }
    case "get-product-details": {
      const { handle } = commerceSchemas[tool].parse(input);
      const product = await getProductWithVariants({ handle });
      return product
        ? { product: toAgentProductDetails(product) }
        : { error: "Product not found." };
    }
    case "get-recommendations": {
      const { handle } = commerceSchemas[tool].parse(input);
      const [related, complementary] = await Promise.all([
        getRelatedProducts({ handle }),
        getComplementaryProducts({ handle }),
      ]);
      return {
        products: [
          ...new Map(
            [...related, ...complementary].map((product) => [product.id, product]),
          ).values(),
        ]
          .slice(0, 12)
          .map(toAgentProduct),
      };
    }
    case "list-collections":
      commerceSchemas[tool].parse(input);
      return {
        collections: (await getCollections()).map(({ description, handle, title }) => ({
          description,
          handle,
          title,
        })),
      };
    case "browse-collection": {
      const { collection, sortKey } = commerceSchemas[tool].parse(input);
      const { products } = await getCollectionProducts({ collection, limit: 12, sortKey });
      return { products: products.map(toAgentProduct) };
    }
    case "get-cart": {
      commerceSchemas[tool].parse(input);
      const cart = await getCartById(cartId);
      if (!cart) return { error: "Cart is unavailable. Refresh the storefront." };
      return {
        empty: !cart.lines.nodes.length,
        lines: cart.lines.nodes.map((line) => ({
          lineId: line.id,
          options: line.merchandise.selectedOptions.map((option) => option.value).join(" / "),
          productTitle: line.merchandise.product.title,
          quantity: line.quantity,
          variantId: line.merchandise.id,
        })),
        totalQuantity: cart.totalQuantity,
      };
    }
    default: {
      if (!cartId) return { error: "Open the storefront to change your cart." };
      let payload: object;
      if (tool === "add-to-cart") {
        const { quantity, variantId } = commerceSchemas[tool].parse(input);
        payload = { lines: [{ merchandiseId: variantId, quantity }] };
      } else if (tool === "update-cart-item") {
        const { lineId, quantity } = commerceSchemas[tool].parse(input);
        const cart = await getCartById(cartId);
        if (!cart?.lines.nodes.some((line) => line.id === lineId))
          return { error: "This line is not in the current cart." };
        payload = { lines: [{ id: lineId, quantity }] };
      } else {
        payload = commerceSchemas["add-cart-note"].parse(input);
      }
      const request = new Request(new URL("/api/cart", shopConfig.site.url), {
        body: JSON.stringify(payload),
        headers: {
          "content-type": "application/json",
          cookie: createCartCookie(cartId).split(";")[0],
        },
        method: "POST",
      });
      const requestContext = createShopifyRequestContext({
        i18n: shopConfig.localization,
        request,
      });
      const storefrontClient = createRequestStorefrontClient(requestContext);
      const result = await cartHandlers.post({ request, storefrontClient });
      if (result.type !== "json") throw new Error("Cart mutation could not be confirmed.");
      const data = z
        .object({
          cart: z.object({ id: z.string() }).nullable(),
          userErrors: z.array(z.object({ message: z.string() })).optional(),
          warnings: z.array(z.object({ message: z.string() })).optional(),
        })
        .parse(result.data);
      if (data.userErrors?.length)
        return { error: data.userErrors.map((error) => error.message).join("; ") };
      if (!data.cart || data.cart.id !== cartId)
        throw new Error("Cart change could not be confirmed.");
      return {
        cartUpdated: true,
        warnings: data.warnings?.map((warning) => warning.message) ?? [],
      };
    }
  }
}
