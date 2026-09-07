import type { Cart, CartWarning } from "@/lib/cart/types";

export interface CartMutationLine {
  attributes?: { key: string; value: string }[];
  merchandiseId: string;
  quantity: number;
}

export interface CartMutationResponse {
  cart: Cart | null;
  userErrors?: { code?: string; field?: string[]; message: string }[];
  warnings?: CartWarning[];
}
