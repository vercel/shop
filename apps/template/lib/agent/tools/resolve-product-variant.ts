import { tool } from "ai";
import { z } from "zod";

import { getProductSelection } from "@/lib/shopify/operations/products";

import { getAgentContext } from "../server";

export function resolveProductVariantTool() {
  return tool({
    description: `Resolve product option values to an exact Shopify variant.
Use this after the user chooses options such as color and size, especially when getProductDetails reports a representative rather than exhaustive variant set.
Do not add a variant that requires bundle components unless this tool returns fixed bundle components.`,
    inputSchema: z.object({
      handle: z.string().describe("The product handle"),
      selected_options: z
        .array(
          z.object({
            name: z.string().describe("Option name, such as Color or Size"),
            value: z.string().describe("Chosen option value"),
          }),
        )
        .min(1)
        .describe("The user's chosen product options"),
    }),
    execute: async ({ handle, selected_options }) => {
      const { user } = getAgentContext();

      try {
        const selection = await getProductSelection({
          handle,
          selectedOptions: selected_options,
          locale: user.locale,
        });
        const variant = selection?.selectedVariant;

        if (!variant) {
          return {
            success: false,
            error: "No selectable variant matches those options.",
          };
        }

        const resolvedOptions = new Map(
          variant.selectedOptions.map((option) => [option.name.toLowerCase(), option.value]),
        );
        const requestedOptions = new Map(
          selected_options.map((option) => [option.name.toLowerCase(), option.value]),
        );
        const meaningfulOptions = variant.selectedOptions.filter(
          (option) => !(option.name === "Title" && option.value === "Default Title"),
        );
        const exactMatch =
          meaningfulOptions.every(
            (option) =>
              requestedOptions.get(option.name.toLowerCase())?.toLowerCase() ===
              option.value.toLowerCase(),
          ) &&
          selected_options.every(
            (option) =>
              resolvedOptions.get(option.name.toLowerCase())?.toLowerCase() ===
              option.value.toLowerCase(),
          );

        if (!exactMatch) {
          return {
            success: false,
            error: "Those option values do not resolve to an exact variant.",
            resolvedOptions: variant.selectedOptions,
          };
        }

        return {
          success: true,
          variant: {
            id: variant.id,
            title: variant.title,
            handle: variant.productHandle,
            available: variant.availableForSale,
            price: `${variant.price.amount} ${variant.price.currencyCode}`,
            options: variant.selectedOptions,
            requiresComponents: variant.requiresComponents,
            canAddDirectly:
              variant.availableForSale &&
              (!variant.requiresComponents || variant.components.length > 0),
            components: variant.components.map((component) => ({
              id: component.variant.id,
              productTitle: component.variant.product.title,
              variantTitle: component.variant.title,
              quantity: component.quantity,
            })),
          },
        };
      } catch (error) {
        console.error("Failed to resolve product variant:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to resolve product variant",
        };
      }
    },
  });
}
