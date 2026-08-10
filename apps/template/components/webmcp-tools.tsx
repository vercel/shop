"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { useCart } from "@/components/cart/context";
import { addToCart } from "@/lib/cart/client";
import {
  getWebMCPCartAction,
  getWebMCPProductOptionsAction,
  prepareWebMCPAddToCartAction,
  searchWebMCPProductsAction,
} from "@/lib/webmcp/action";

// WebMCP is not in TypeScript's DOM library yet, so type only the capability used here.
interface WebMCPTool {
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  description: string;
  execute(input: object): Promise<unknown>;
  inputSchema?: object;
  name: string;
  title?: string;
}

interface WebMCPModelContext {
  registerTool(tool: WebMCPTool, options?: { signal?: AbortSignal }): Promise<void>;
}

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

export function WebMCPTools() {
  const { openOverlay } = useCart();
  const t = useTranslations("webmcp");

  useEffect(() => {
    const { modelContext } = document as unknown as {
      readonly modelContext?: WebMCPModelContext;
    };
    if (typeof modelContext?.registerTool !== "function") return;

    // Aborting this signal unregisters every tool when the component unmounts.
    const controller = new AbortController();
    const options = { signal: controller.signal };

    void Promise.all([
      modelContext.registerTool(
        {
          name: "shop.search_products",
          title: t("searchProductsTitle"),
          description:
            "Search this store's catalog. Use a returned handle with shop.get_product_options.",
          inputSchema: searchProductsInputSchema,
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: searchWebMCPProductsAction,
        },
        options,
      ),
      modelContext.registerTool(
        {
          name: "shop.get_product_options",
          title: t("getProductOptionsTitle"),
          description:
            "List option name and value pairs for a product. Use nextOptionOffset to continue.",
          inputSchema: getProductOptionsInputSchema,
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: getWebMCPProductOptionsAction,
        },
        options,
      ),
      modelContext.registerTool(
        {
          name: "shop.get_cart",
          title: t("getCartTitle"),
          description:
            "Read a redacted page of the guest cart. Use variantId to verify an uncertain add.",
          inputSchema: getCartInputSchema,
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: getWebMCPCartAction,
        },
        options,
      ),
      modelContext.registerTool(
        {
          name: "shop.add_to_cart",
          title: t("addToCartTitle"),
          description: "Add one available variant to the guest cart and open the cart for review.",
          inputSchema: addToCartInputSchema,
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: async (input) => {
            const prepared = await prepareWebMCPAddToCartAction(input);
            if ("error" in prepared) return prepared;

            const result = await addToCart(prepared.variantId, prepared.quantity);
            if (result.applied === true) openOverlay();
            return result.applied === false ? result : { ...result, variantId: prepared.variantId };
          },
        },
        options,
      ),
    ]).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      controller.abort();
      console.error("WebMCP tool registration failed", error);
    });

    return () => controller.abort();
  }, [openOverlay, t]);

  return null;
}
