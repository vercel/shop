"use client";

import { useEffect } from "react";
import { useWebMCP } from "use-webmcp-tool";

import { useCart } from "@/components/cart/context";
import { addToCart } from "@/lib/cart/client";
import {
  getWebMCPCartAction,
  getWebMCPProductOptionsAction,
  prepareWebMCPAddToCartAction,
  searchWebMCPProductsAction,
} from "@/lib/webmcp/action";

const MUTATING_ANNOTATIONS = { readOnlyHint: false, untrustedContentHint: false } as const;
const READ_ONLY_ANNOTATIONS = { readOnlyHint: true, untrustedContentHint: true } as const;

const searchProductsInputSchema = {
  type: "object",
  properties: {
    query: {
      type: "string",
      minLength: 1,
      maxLength: 120,
      description: "Words to search for in the catalog.",
    },
    cursor: {
      type: "string",
      maxLength: 512,
      description: "The nextCursor from the previous search page.",
    },
  },
  required: ["query"],
  additionalProperties: false,
} as const;

const getProductOptionsInputSchema = {
  type: "object",
  properties: {
    handle: {
      type: "string",
      minLength: 1,
      maxLength: 255,
      pattern: "^[A-Za-z0-9][A-Za-z0-9-]*$",
      description: "A product handle returned by shop.search_products.",
    },
    optionOffset: {
      type: "integer",
      minimum: 0,
      default: 0,
      description: "The nextOptionOffset from the previous options page.",
    },
  },
  required: ["handle"],
  additionalProperties: false,
} as const;

const getCartInputSchema = {
  type: "object",
  properties: {
    lineOffset: {
      type: "integer",
      minimum: 0,
      maximum: 49,
      default: 0,
      description: "The nextLineOffset from the previous cart page.",
    },
  },
  additionalProperties: false,
} as const;

const addToCartInputSchema = {
  type: "object",
  properties: {
    productHandle: {
      type: "string",
      minLength: 1,
      maxLength: 255,
      pattern: "^[A-Za-z0-9][A-Za-z0-9-]*$",
      description: "A product handle returned by shop.search_products.",
    },
    selectedOptions: {
      type: "array",
      maxItems: 3,
      description: "One name and value from shop.get_product_options for every product option.",
      items: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
          value: { type: "string", minLength: 1, maxLength: 255 },
        },
        required: ["name", "value"],
        additionalProperties: false,
      },
    },
    quantity: {
      type: "integer",
      minimum: 1,
      maximum: 99,
      default: 1,
      description: "Number of units to add.",
    },
  },
  required: ["productHandle", "selectedOptions"],
  additionalProperties: false,
} as const;

// Tool actions report failures as `{ error }` payloads, which the hook would otherwise serialize as a successful result.
function markToolErrors(result: unknown) {
  if (result !== null && typeof result === "object" && "error" in result) {
    return { content: [{ text: JSON.stringify(result.error), type: "text" }], isError: true };
  }
  return result;
}

type StorefrontToolOptions = Omit<Parameters<typeof useWebMCP>[0], "formatOutput">;

function useStorefrontTool(options: StorefrontToolOptions) {
  const { error } = useWebMCP({ ...options, formatOutput: markToolErrors });

  useEffect(() => {
    if (error) console.error(`WebMCP tool ${options.name} failed to register`, error);
  }, [error, options.name]);
}

export function WebMCPTools() {
  const { openOverlay } = useCart();

  // TODO(gaojude): pass localized `title` again once use-webmcp-tool forwards it to registerTool.
  useStorefrontTool({
    annotations: READ_ONLY_ANNOTATIONS,
    description:
      "Search this store's catalog. Use a returned handle with shop.get_product_options.",
    execute: searchWebMCPProductsAction,
    inputSchema: searchProductsInputSchema,
    name: "shop.search_products",
  });

  useStorefrontTool({
    annotations: READ_ONLY_ANNOTATIONS,
    description:
      "List option name and value pairs for a product. Use nextOptionOffset to continue.",
    execute: getWebMCPProductOptionsAction,
    inputSchema: getProductOptionsInputSchema,
    name: "shop.get_product_options",
  });

  useStorefrontTool({
    annotations: READ_ONLY_ANNOTATIONS,
    description:
      "Read a redacted page of the guest cart. Use variantId to verify an uncertain add.",
    execute: getWebMCPCartAction,
    inputSchema: getCartInputSchema,
    name: "shop.get_cart",
  });

  useStorefrontTool({
    annotations: MUTATING_ANNOTATIONS,
    description: "Add one available variant to the guest cart and open the cart for review.",
    execute: async (input) => {
      const prepared = await prepareWebMCPAddToCartAction(input);
      if ("error" in prepared) return prepared;

      const result = await addToCart(prepared.variantId, prepared.quantity);
      if (result.applied === true) openOverlay();
      return result.applied === false ? result : { ...result, variantId: prepared.variantId };
    },
    inputSchema: addToCartInputSchema,
    name: "shop.add_to_cart",
  });

  return null;
}
