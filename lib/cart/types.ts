import type { CartDataFromHandlers, CartGetData } from "@shopify/hydrogen";

import type { cartHandlers } from "./server";

export type Cart = CartDataFromHandlers<typeof cartHandlers>;
export type CartLine = Cart["lines"]["nodes"][number];
export type CartSeedData = CartGetData<Cart>;
