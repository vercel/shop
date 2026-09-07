import type { CartUserError } from "@shopify/hydrogen";

import type { Cart, CartWarning } from "@/lib/cart/types";

export interface CartMutationResponse {
  cart: Cart | null;
  userErrors?: CartUserError[];
  warnings?: CartWarning[];
}

export type CartToolResult = { cartUpdated: true; warnings: string[] } | { error: string };

export type CartMutation =
  | {
      action: "add";
      lines: { merchandiseId: string; quantity: number }[];
    }
  | {
      action: "remove" | "update";
      lines: { id: string; quantity: number }[];
    }
  | { note: string };
