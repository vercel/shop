import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

export const catalog = defineCatalog(schema, {
  actions: {},
  components: {
    AgentCartSummary: {
      description:
        "The shopper's live cart with quantity steppers, remove buttons, totals, and a checkout button. " +
        "Takes no props — it reads real cart state. Render it after getCart or any cart mutation.",
      props: z.object({}),
    },

    AgentProductCard: {
      description:
        "A single product card. Pass only the handle returned by a product tool; the card resolves " +
        "its own image, title, price, and availability from that tool result.",
      props: z.object({
        handle: z.string(),
      }),
    },

    AgentProductGrid: {
      description:
        "A responsive grid container for AgentProductCard children. Always wrap multiple product cards in this grid.",
      props: z.object({
        title: z.string().nullable(),
      }),
      slots: ["default"],
    },

    AgentVariantPicker: {
      description:
        "An interactive variant picker for one product. Pass only the handle from getProductDetails. " +
        "The shopper selects options and adds to cart directly, so do not ask them to type a variant choice.",
      props: z.object({
        handle: z.string(),
      }),
    },
  },
});
