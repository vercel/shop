import { StorefrontApiError, type GraphQLFormattedError } from "@shopify/hydrogen";

import type { CartWarning } from "@/lib/types";

import { shopifyLogger } from "./logging";

interface StorefrontResponse<T> {
  data?: T | null;
  errors?: GraphQLFormattedError[];
}

export function assertStorefrontOk<T>(
  response: StorefrontResponse<T>,
  operation: string,
): asserts response is { data: T; errors?: GraphQLFormattedError[] } {
  if (response.errors?.length && !response.data) {
    const [firstError, ...additionalErrors] = response.errors;
    throw new StorefrontApiError(`Shopify ${operation} failed: ${firstError.message}`, {
      extensions: {
        ...firstError.extensions,
        additionalErrors,
        operation,
      },
      locations: firstError.locations,
      path: firstError.path,
    });
  }
  if (response.errors?.length) {
    shopifyLogger.warn("Storefront API returned partial errors", {
      errors: response.errors,
      operation,
      scope: "storefront",
    });
  }
  if (!response.data) {
    throw new StorefrontApiError(`Shopify ${operation}: no data returned`, {
      extensions: { operation },
    });
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
  payload: CartMutationPayload<T> | null | undefined,
  operation: string,
): { cart: T; warnings: CartWarning[] } {
  if (!payload) {
    throw new Error(`Shopify ${operation}: mutation returned no payload`);
  }
  if (payload.userErrors && payload.userErrors.length > 0) {
    throw new ShopifyUserError(payload.userErrors, operation);
  }
  if (!payload.cart) {
    throw new Error(`Shopify ${operation}: cart missing from response`);
  }
  return { cart: payload.cart, warnings: payload.warnings ?? [] };
}
