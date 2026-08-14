"use client";

import type { OptimisticProductInfo } from "@/lib/product";

const ENDPOINT = "/api/cart";
const TIMEOUT_MS = 10_000;
const LINES_UPDATE_EVENT = "shopify:cart:lines-update";

interface CartMutationLine {
  attributes?: { key: string; value: string }[];
  merchandiseId: string;
  quantity: number;
}

interface GraphqlMoney {
  amount: string;
  currencyCode: string;
}

interface GraphqlCartLine {
  attributes?: { key: string; value: string }[];
  cost?: {
    amountPerQuantity?: GraphqlMoney | null;
    totalAmount?: GraphqlMoney;
  };
  id: string;
  merchandise: { id: string; price?: GraphqlMoney | null };
  quantity: number;
}

interface GraphqlCart {
  id: string;
  checkoutUrl?: string | null;
  cost: {
    subtotalAmount: GraphqlMoney;
    totalAmount: GraphqlMoney;
  };
  discountCodes?: { applicable: boolean; code: string }[];
  lines: { nodes: GraphqlCartLine[] };
  note?: string | null;
  totalQuantity: number;
}

interface CartMutationResponse {
  cart: GraphqlCart | null;
  userErrors?: { code?: string; field?: string[]; message: string }[];
  warnings?: { code: string; message: string }[];
}

async function postCart(payload: Record<string, unknown>): Promise<CartMutationResponse> {
  const response = await fetch(ENDPOINT, {
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Cart request failed: ${response.status}`);
  return response.json() as Promise<CartMutationResponse>;
}

// The standard event flattens cart.lines.nodes into cart.lines for the store.
function toStandardCart(cart: GraphqlCart) {
  const { lines, ...rest } = cart;
  return { ...rest, lines: lines.nodes };
}

function productDetail(info: OptimisticProductInfo, merchandiseId: string) {
  return {
    id: merchandiseId,
    image: info.image,
    price: info.price,
    product: { handle: info.productHandle, title: info.productTitle },
    selectedOptions: info.selectedOptions,
    title: info.variantTitle,
  };
}

function dispatchLinesAdd(
  lines: CartMutationLine[],
  productInfo: OptimisticProductInfo | undefined,
  promise: Promise<{ cart: ReturnType<typeof toStandardCart> | null }>,
) {
  const event = new Event(LINES_UPDATE_EVENT, { bubbles: true, cancelable: true }) as Event & {
    action: string;
    detail: { products: ReturnType<typeof productDetail>[] };
    lines: { merchandiseId: string; quantity: number }[];
    promise: typeof promise;
  };
  event.action = "add";
  event.lines = lines.map((l) => ({ merchandiseId: l.merchandiseId, quantity: l.quantity }));
  event.detail = {
    products: productInfo ? lines.map((l) => productDetail(productInfo, l.merchandiseId)) : [],
  };
  event.promise = promise;
  document.dispatchEvent(event);
}

function dispatchLinesUpdate(
  action: "remove" | "update",
  lines: { id: string; quantity: number }[],
  promise: Promise<{ cart: ReturnType<typeof toStandardCart> | null }>,
) {
  const event = new Event(LINES_UPDATE_EVENT, { bubbles: true, cancelable: true }) as Event & {
    action: string;
    lines: { id: string; quantity: number }[];
    promise: typeof promise;
  };
  event.action = action;
  event.lines = lines;
  event.promise = promise;
  document.dispatchEvent(event);
}

// Bypasses the preview's broken standard-actions updateCart handler: POST to our
// route and feed the standard lines-update event the store listens for.
export function addToCart(
  merchandiseId: string,
  quantity: number,
  productInfo?: OptimisticProductInfo,
  attributes?: { key: string; value: string }[],
): void {
  const line: CartMutationLine = { merchandiseId, quantity, ...(attributes ? { attributes } : {}) };
  const promise = postCart({ lines: [line] }).then((result) => ({
    cart: result.cart ? toStandardCart(result.cart) : null,
  }));
  dispatchLinesAdd([line], productInfo, promise);
}

export function updateCartLine(lineId: string, quantity: number): void {
  const promise = postCart({ lines: [{ id: lineId, quantity }] }).then((result) => ({
    cart: result.cart ? toStandardCart(result.cart) : null,
  }));
  dispatchLinesUpdate(quantity === 0 ? "remove" : "update", [{ id: lineId, quantity }], promise);
}

export interface ServerCartLine {
  components?: ServerCartLine[];
  cost: { totalAmount: GraphqlMoney };
  id?: string;
  merchandise: {
    compareAtPrice?: GraphqlMoney;
    id: string;
    image?: { altText: string; height: number; url: string; width: number };
    price?: GraphqlMoney;
    product: { handle: string; id: string; title: string };
    selectedOptions: { name: string; value: string }[];
    title: string;
  };
  quantity: number;
}

export interface ServerCart {
  checkoutUrl: string;
  cost: { subtotalAmount: GraphqlMoney; totalAmount: GraphqlMoney };
  discountCodes?: { applicable: boolean; code: string }[];
  id?: string;
  lines: ServerCartLine[];
  note?: string | null;
  totalQuantity: number;
}

// The store reads bundle children from `lineComponents`, so the domain name must be translated.
function toStoreLine(line: ServerCartLine): Record<string, unknown> {
  return {
    ...line,
    id: line.id ?? "",
    lineComponents: (line.components ?? []).map(toStoreLine),
  };
}

/**
 * Applies a cart already mutated on the server (by the assistant) to the client store.
 * The store only accepts cart state through the standard events, so this dispatches one
 * with a settled promise instead of re-running the mutation.
 */
export function applyServerCart(
  action: "add" | "remove" | "update",
  cart: ServerCart,
  changedLines: { id?: string; merchandiseId?: string; quantity: number }[],
): void {
  const resolved = Promise.resolve({
    cart: { ...cart, lines: cart.lines.map(toStoreLine) },
  });
  const event = new Event(LINES_UPDATE_EVENT, { bubbles: true, cancelable: true }) as Event & {
    action: string;
    detail?: { products: unknown[] };
    lines: unknown[];
    promise: typeof resolved;
  };
  event.action = action;
  event.lines = changedLines;
  if (action === "add") event.detail = { products: [] };
  event.promise = resolved;
  document.dispatchEvent(event);
}

// Discounts bypass the Hydrogen discount-update event: its handler renders new codes as
// `applicable: false` until the server resolves, which flashes an "invalid" pill. We await
// the mutation and hand the resolved cart to the overlay through this local event instead.
const DISCOUNT_RESOLVED_EVENT = "shop:cart:discount-resolved";

export interface DiscountResolution {
  cart: {
    discountCodes: { applicable: boolean; code: string }[];
    id?: string | null;
    lines?: {
      catalogPrice: GraphqlMoney | null;
      id: string;
      originalAmount: GraphqlMoney;
      quantity: number;
      totalAmount: GraphqlMoney;
    }[];
  } | null;
  error: string | null;
}

// The discount mutation replaces the whole code set, so apply/remove recompute the full list.
async function setDiscountCodes(discountCodes: string[]): Promise<DiscountResolution> {
  try {
    const result = await postCart({ discountCodes });
    if (!result.cart) {
      const message =
        result.userErrors?.[0]?.message ??
        result.warnings?.[0]?.message ??
        "Failed to update discount";
      return { cart: null, error: message };
    }
    const cart = result.cart;
    return {
      cart: {
        discountCodes: cart.discountCodes ?? [],
        id: cart.id,
        // The mutation response carries the post-discount line costs; forward them so the
        // overlay can reprice immediately instead of waiting on a store refetch.
        lines: cart.lines.nodes
          .filter((l) => l.cost?.totalAmount && l.cost?.amountPerQuantity)
          .map((l) => ({
            catalogPrice: l.merchandise.price ?? null,
            id: l.id,
            originalAmount: l.cost?.amountPerQuantity as GraphqlMoney,
            quantity: l.quantity,
            totalAmount: l.cost?.totalAmount as GraphqlMoney,
          })),
      },
      error: null,
    };
  } catch (error) {
    return { cart: null, error: error instanceof Error ? error.message : "Network error" };
  }
}

export async function applyDiscount(
  code: string,
  existingCodes: string[],
): Promise<DiscountResolution> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { cart: null, error: "Empty discount code" };
  if (existingCodes.some((c) => c.toUpperCase() === normalized)) {
    return { cart: null, error: null };
  }
  const resolution = await setDiscountCodes([...existingCodes, normalized]);
  document.dispatchEvent(
    new CustomEvent<DiscountResolution>(DISCOUNT_RESOLVED_EVENT, { detail: resolution }),
  );
  return resolution;
}

export async function removeDiscount(
  code: string,
  existingCodes: string[],
): Promise<DiscountResolution> {
  const normalized = code.trim().toUpperCase();
  const resolution = await setDiscountCodes(
    existingCodes.filter((c) => c.toUpperCase() !== normalized),
  );
  document.dispatchEvent(
    new CustomEvent<DiscountResolution>(DISCOUNT_RESOLVED_EVENT, { detail: resolution }),
  );
  return resolution;
}

export { DISCOUNT_RESOLVED_EVENT };
