"use client";

import type { OptimisticProductInfo } from "@/lib/product";

import type { Cart, CartWarning } from "./index";

const ENDPOINT = "/api/cart";
const TIMEOUT_MS = 10_000;
const LINES_UPDATE_EVENT = "shopify:cart:lines-update";

interface CartMutationLine {
  attributes?: { key: string; value: string }[];
  merchandiseId: string;
  quantity: number;
}

interface CartMutationResponse {
  cart: Cart | null;
  userErrors?: { code?: string; field?: string[]; message: string }[];
  warnings?: CartWarning[];
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

// Standard events flatten cart.lines.nodes while preserving mutation errors and warnings.
function toStandardResult(result: CartMutationResponse) {
  const { cart, ...rest } = result;
  if (!cart) return { ...rest, cart: null };
  const { lines, ...cartData } = cart;
  return { ...rest, cart: { ...cartData, lines: lines.nodes } };
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
  promise: Promise<ReturnType<typeof toStandardResult>>,
) {
  const event = new Event(LINES_UPDATE_EVENT, { bubbles: true, cancelable: true }) as Event & {
    action: string;
    detail: { products: ReturnType<typeof productDetail>[] };
    lines: CartMutationLine[];
    promise: typeof promise;
  };
  event.action = "add";
  event.lines = lines;
  event.detail = {
    products: productInfo ? lines.map((l) => productDetail(productInfo, l.merchandiseId)) : [],
  };
  event.promise = promise;
  document.dispatchEvent(event);
}

// Only for adds that need line attributes; this preview's add form drops them. Use useProductForm/useCartForm otherwise.
export function addGiftCardToCart(
  merchandiseId: string,
  quantity: number,
  productInfo?: OptimisticProductInfo,
  attributes?: { key: string; value: string }[],
): void {
  const line: CartMutationLine = { merchandiseId, quantity, ...(attributes ? { attributes } : {}) };
  const promise = postCart({ lines: [line] }).then(toStandardResult);
  dispatchLinesAdd([line], productInfo, promise);
}
