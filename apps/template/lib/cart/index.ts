"use client";

import { createCartComponents } from "@shopify/hydrogen/react";

import type { cartHandlers } from "./handlers";

export const { CartProvider, useCart, useCartForm, useOptionalCart, useSuspenseCart } =
  createCartComponents<typeof cartHandlers>();
