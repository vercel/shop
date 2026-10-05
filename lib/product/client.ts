"use client";

import { createProductComponents } from "@shopify/hydrogen/react";

import type { ProductFormInput } from "./types";

export const { ProductProvider, useProduct, useProductForm } =
  createProductComponents<ProductFormInput>();
