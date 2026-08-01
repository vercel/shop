"use client";

import type { OptimisticProductInfo } from "@/lib/product";

const ENDPOINT = "/api/cart";
const TIMEOUT_MS = 10_000;
const LINES_UPDATE_EVENT = "shopify:cart:lines-update";
const DISCOUNT_UPDATE_EVENT = "shopify:cart:discount-update";

interface CartMutationLine {
  merchandiseId: string;
  quantity: number;
}

interface GraphqlMoney {
  amount: string;
  currencyCode: string;
}

interface GraphqlCartLine {
  id: string;
  merchandise: { id: string };
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
): void {
  const promise = postCart({ lines: [{ merchandiseId, quantity }] }).then((result) => ({
    cart: result.cart ? toStandardCart(result.cart) : null,
  }));
  dispatchLinesAdd([{ merchandiseId, quantity }], productInfo, promise);
}

export function updateCartLine(lineId: string, quantity: number): void {
  const promise = postCart({ lines: [{ id: lineId, quantity }] }).then((result) => ({
    cart: result.cart ? toStandardCart(result.cart) : null,
  }));
  dispatchLinesUpdate(quantity === 0 ? "remove" : "update", [{ id: lineId, quantity }], promise);
}

// The discount mutation replaces the whole code set, so apply/remove recompute the full list.
function dispatchDiscountUpdate(
  discountCodes: string[],
  promise: Promise<{ cart: ReturnType<typeof toStandardCart> | null }>,
): void {
  const event = new Event(DISCOUNT_UPDATE_EVENT, { bubbles: true, cancelable: true }) as Event & {
    discountCodes: { code: string }[];
    promise: typeof promise;
  };
  event.discountCodes = discountCodes.map((code) => ({ code }));
  event.promise = promise;
  document.dispatchEvent(event);
}

function setDiscountCodes(discountCodes: string[]): void {
  const promise = postCart({ discountCodes }).then((result) => ({
    cart: result.cart ? toStandardCart(result.cart) : null,
  }));
  dispatchDiscountUpdate(discountCodes, promise);
}

export function applyDiscount(code: string, existingCodes: string[]): void {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return;
  if (existingCodes.some((c) => c.toUpperCase() === normalized)) return;
  setDiscountCodes([...existingCodes, normalized]);
}

export function removeDiscount(code: string, existingCodes: string[]): void {
  const normalized = code.trim().toUpperCase();
  setDiscountCodes(existingCodes.filter((c) => c.toUpperCase() !== normalized));
}
