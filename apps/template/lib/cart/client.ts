"use client";

import { createCartComponents } from "@shopify/hydrogen/react";

import type { cartHandlers } from "./server";

export const { useSuspenseCart } = createCartComponents<typeof cartHandlers>();
