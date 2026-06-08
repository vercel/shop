import type { CartWarning } from "@/lib/types";

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
