import type { GraphQLFormattedError } from "@shopify/hydrogen";

import { shopifyLogger } from "@/lib/shopify/logging/server";
import type { StorefrontResponse } from "@/lib/shopify/types";

export function assertStorefrontOk<T>(
  response: StorefrontResponse<T>,
  operation: string,
): asserts response is { data: T; errors?: GraphQLFormattedError[] } {
  if (response.errors?.length && !response.data) {
    const [firstError] = response.errors;
    // StorefrontApiError represents transport failures, not returned GraphQL errors.
    throw new Error(`Shopify ${operation} failed: ${firstError.message}`, {
      cause: { errors: response.errors, operation },
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
