import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

export const catalog = defineCatalog(schema, {
  actions: {},
  components: {
    AgentProductCard: {
      props: z.object({
        title: z.string(),
        handle: z.string(),
        image: z.string().nullable(),
        price: z.string(),
        compareAtPrice: z.string().nullable(),
        available: z.boolean(),
      }),
      description:
        "A product card displaying an image, title, price, and availability. " +
        "Use this to show product results from tools. The price and compareAtPrice " +
        'props use the format returned by product tools (e.g. "100.00 USD").',
    },
    AgentProductGrid: {
      props: z.object({
        title: z.string().nullable(),
      }),
      slots: ["default"],
      description:
        "A responsive grid container for multiple AgentProductCard components. " +
        "Always wrap multiple product cards in this grid.",
    },

    AgentCartSummary: {
      props: z.object({
        items: z.array(
          z.object({
            productTitle: z.string(),
            variantTitle: z.string(),
            image: z.string().nullable(),
            options: z.string(),
            quantity: z.number(),
            totalPrice: z.string(),
            handle: z.string(),
          }),
        ),
        subtotal: z.string(),
        total: z.string(),
        tax: z.string(),
        totalQuantity: z.number(),
        checkoutUrl: z.string(),
      }),
      description:
        "A rich cart summary card showing line items with thumbnails, quantities, " +
        "prices, cost breakdown (subtotal/tax/total), and a checkout button. " +
        "Use when getCart returns a non-empty cart.",
    },

    AgentCartConfirmation: {
      props: z.object({
        productTitle: z.string(),
        variantTitle: z.string().nullable(),
        image: z.string().nullable(),
        quantity: z.number(),
        price: z.string(),
        handle: z.string(),
      }),
      description:
        "A compact confirmation card shown after a successful addToCart call. " +
        'Displays a green "Added to cart" banner with product thumbnail, title, variant, and price.',
    },

    AgentVariantPicker: {
      props: z.object({
        productTitle: z.string(),
        handle: z.string(),
        image: z.string().nullable(),
        options: z.array(
          z.object({
            name: z.string(),
            values: z.array(z.string()),
          }),
        ),
        variants: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            available: z.boolean(),
            price: z.string(),
            options: z.string(),
          }),
        ),
      }),
      description:
        "Displays available variants for a product so the user can choose one. " +
        "Shows option groups as pills and a list of variants with price/availability. " +
        "Display-only — the user picks a variant by typing in chat.",
    },
  },
});
