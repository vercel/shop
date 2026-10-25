import type { CartDataFromHandlers, CartGetData } from "@shopify/hydrogen";

import type { cartHandlers } from "./request";

export type Cart = CartDataFromHandlers<typeof cartHandlers>;
export type CartLine = Cart["lines"]["nodes"][number];
export type CartSeedData = CartGetData<Cart>;
