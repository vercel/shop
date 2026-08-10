"use server";

import { z } from "zod";

import { getLocale } from "@/lib/params";
import { getCart } from "@/lib/shopify/operations/cart";
import {
  getProduct,
  getProductVariant,
  searchIndexProducts,
} from "@/lib/shopify/operations/products";
import type { CartLine, ProductCard, SelectedOption } from "@/lib/types";

const MAX_OUTPUT_CHARACTERS = 1_450;
const OPTION_PAGE_SIZE = 4;
const CART_PAGE_SIZE = 2;

const productHandle = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^[A-Za-z0-9][A-Za-z0-9-]*$/);

const searchProductsInput = z.strictObject({
  query: z.string().trim().min(1).max(120),
  cursor: z.string().max(512).optional(),
});
const getProductOptionsInput = z.strictObject({
  handle: productHandle,
  optionOffset: z.number().int().min(0).optional(),
});
const getCartInput = z.strictObject({
  lineOffset: z.number().int().min(0).max(49).optional(),
});
const selectedOptionInput = z.strictObject({
  name: z.string().trim().min(1).max(255),
  value: z.string().trim().min(1).max(255),
});
const addToCartInput = z.strictObject({
  productHandle,
  selectedOptions: z.array(selectedOptionInput).max(3),
  quantity: z.number().int().min(1).max(99).optional(),
});

type WebMCPErrorCode =
  | "INVALID_INPUT"
  | "NOT_ALLOWED"
  | "NOT_AVAILABLE"
  | "NOT_FOUND"
  | "UPSTREAM_UNAVAILABLE";

function toolError(code: WebMCPErrorCode, message: string) {
  return { error: { code, message } };
}

function conciseText(value: string, maximumLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maximumLength
    ? `${normalized.slice(0, maximumLength - 1)}…`
    : normalized;
}

function conciseProduct(product: ProductCard) {
  return {
    available: product.availableForSale,
    handle: product.handle,
    price: product.price,
    title: conciseText(product.title, 80),
  };
}

function conciseCartLine(line: CartLine) {
  return {
    lineTotal: line.cost.totalAmount,
    productHandle: line.merchandise.product.handle,
    productTitle: conciseText(line.merchandise.product.title, 60),
    quantity: line.quantity,
    variantId: line.merchandise.id,
    variantTitle: conciseText(line.merchandise.title, 48),
  };
}

function fitItemsToOutputBudget<Item, Output>(
  items: Item[],
  buildOutput: (includedItems: Item[]) => Output,
): Output {
  const includedItems: Item[] = [];

  for (const item of items) {
    const candidate = buildOutput([...includedItems, item]);
    if (JSON.stringify(candidate).length > MAX_OUTPUT_CHARACTERS) break;
    includedItems.push(item);
  }

  return buildOutput(includedItems);
}

function sameText(left: string, right: string) {
  return left.toLocaleLowerCase() === right.toLocaleLowerCase();
}

function sameOptions(left: SelectedOption[], right: SelectedOption[]) {
  return (
    left.length === right.length &&
    left.every((option) =>
      right.some(
        (candidate) =>
          sameText(option.name, candidate.name) && sameText(option.value, candidate.value),
      ),
    )
  );
}

export async function searchWebMCPProductsAction(input: unknown) {
  const parsed = searchProductsInput.safeParse(input);
  if (!parsed.success) {
    return toolError("INVALID_INPUT", "The input did not match the tool schema.");
  }

  try {
    const locale = await getLocale();
    const result = await searchIndexProducts({
      cursor: parsed.data.cursor,
      limit: 1,
      locale,
      query: parsed.data.query,
      sortKey: "best-matches",
    });

    return {
      nextCursor: result.pageInfo.hasNextPage ? result.pageInfo.endCursor : null,
      products: result.products.map(conciseProduct),
    };
  } catch (error) {
    console.error("WebMCP product search failed", error);
    return toolError("UPSTREAM_UNAVAILABLE", "Product search is unavailable right now.");
  }
}

export async function getWebMCPProductOptionsAction(input: unknown) {
  const parsed = getProductOptionsInput.safeParse(input);
  if (!parsed.success) {
    return toolError("INVALID_INPUT", "The input did not match the tool schema.");
  }

  try {
    const locale = await getLocale();
    const product = await getProduct({ handle: parsed.data.handle, locale });
    if (!product) return toolError("NOT_FOUND", "No product exists for that handle.");

    const optionValues = product.options.flatMap((option) =>
      option.values.map((value) => ({ name: option.name, value: value.name })),
    );
    const offset = parsed.data.optionOffset ?? 0;
    const page = optionValues.slice(offset, offset + OPTION_PAGE_SIZE);

    return fitItemsToOutputBudget(page, (includedOptionValues) => ({
      handle: product.handle,
      nextOptionOffset:
        offset + includedOptionValues.length < optionValues.length
          ? offset + includedOptionValues.length
          : null,
      optionValueCount: optionValues.length,
      optionValues: includedOptionValues,
    }));
  } catch (error) {
    console.error("WebMCP product options failed", error);
    return toolError("UPSTREAM_UNAVAILABLE", "Product options are unavailable right now.");
  }
}

export async function prepareWebMCPAddToCartAction(input: unknown) {
  const parsed = addToCartInput.safeParse(input);
  if (!parsed.success) {
    return toolError("INVALID_INPUT", "The input did not match the tool schema.");
  }

  try {
    const locale = await getLocale();
    const product = await getProduct({ handle: parsed.data.productHandle, locale });
    if (!product) return toolError("NOT_FOUND", "No product exists for that handle.");
    if (parsed.data.selectedOptions.length !== product.options.length) {
      return toolError("INVALID_INPUT", "Select one value for every product option.");
    }

    const selectedOptions: SelectedOption[] = [];
    for (const option of product.options) {
      const requested = parsed.data.selectedOptions.find(({ name }) => sameText(name, option.name));
      const value = requested
        ? option.values.find((candidate) => sameText(candidate.name, requested.value))
        : undefined;
      if (!value) {
        return toolError(
          "INVALID_INPUT",
          "Choose option names and values returned by get_product_options.",
        );
      }
      selectedOptions.push({ name: option.name, value: value.name });
    }

    const variant = await getProductVariant({
      handle: product.handle,
      locale,
      selectedOptions,
    });
    if (!variant || !sameOptions(selectedOptions, variant.selectedOptions)) {
      return toolError("NOT_FOUND", "No variant matches those product options.");
    }
    if (!variant.availableForSale) {
      return toolError("NOT_AVAILABLE", "That product variant is not available.");
    }
    if (variant.requiresComponents) {
      return toolError("NOT_ALLOWED", "Bundle variants are not supported by this tool.");
    }

    return { quantity: parsed.data.quantity ?? 1, variantId: variant.id };
  } catch (error) {
    console.error("WebMCP add-to-cart preparation failed", error);
    return toolError("UPSTREAM_UNAVAILABLE", "The product variant is unavailable right now.");
  }
}

export async function getWebMCPCartAction(input: unknown) {
  const parsed = getCartInput.safeParse(input);
  if (!parsed.success) {
    return toolError("INVALID_INPUT", "The input did not match the tool schema.");
  }

  try {
    const cart = await getCart();
    const lines = (cart?.lines ?? []).map(conciseCartLine);
    const offset = parsed.data.lineOffset ?? 0;
    const page = lines.slice(offset, offset + CART_PAGE_SIZE);

    return fitItemsToOutputBudget(page, (includedLines) => ({
      empty: lines.length === 0,
      lines: includedLines,
      moreLinesMayExist: (cart?.lines.length ?? 0) === 50,
      nextLineOffset:
        offset + includedLines.length < lines.length ? offset + includedLines.length : null,
      total: cart?.cost.totalAmount ?? null,
      totalQuantity: cart?.totalQuantity ?? 0,
    }));
  } catch (error) {
    console.error("WebMCP cart read failed", error);
    return toolError("UPSTREAM_UNAVAILABLE", "The cart is unavailable right now.");
  }
}
