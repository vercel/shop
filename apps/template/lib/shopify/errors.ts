import type { GraphQLFormattedError } from "@shopify/hydrogen";

import type { CartWarning } from "@/lib/types";

interface StorefrontResponse<T> {
  data?: T | null;
  errors?: GraphQLFormattedError[];
}

export function assertStorefrontOk<T>(
  response: StorefrontResponse<T>,
  operation: string,
): asserts response is { data: T; errors?: GraphQLFormattedError[] } {
  if (response.errors?.length && !response.data) {
    const detail = response.errors.map((error) => error.message).join("; ");
    throw new Error(`Shopify ${operation} failed: ${detail}`);
  }
  if (response.errors?.length) {
    const detail = JSON.stringify(response.errors);
    console.warn(`[shopify] ${operation} returned partial errors: ${detail}`);
  }
  if (!response.data) {
    throw new Error(`Shopify ${operation}: no data returned`);
  }
}

export async function withFallback<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export interface UserError {
  field?: string[] | null;
  message: string;
}

export interface CartMutationPayload<T> {
  cart: T | null;
  userErrors: UserError[];
  warnings?: CartWarning[];
}

export class ShopifyUserError extends Error {
  constructor(
    public readonly errors: UserError[],
    public readonly operation: string,
  ) {
    super(errors.map((e) => e.message).join("; "));
    this.name = "ShopifyUserError";
  }
}

export function unwrapCartMutation<T>(
  payload: CartMutationPayload<T>,
  operation: string,
): { cart: T; warnings: CartWarning[] } {
  if (payload.userErrors && payload.userErrors.length > 0) {
    throw new ShopifyUserError(payload.userErrors, operation);
  }
  if (!payload.cart) {
    throw new Error(`Shopify ${operation}: cart missing from response`);
  }
  return { cart: payload.cart, warnings: payload.warnings ?? [] };
}
