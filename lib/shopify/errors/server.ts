import type { GraphQLFormattedError } from "@shopify/hydrogen";

import { shopifyLogger } from "@/lib/shopify/logging/server";
import type { StorefrontResponse } from "@/lib/shopify/types";

// Shopify reports throttling and internal failures as GraphQL errors on HTTP 200 responses.
const TRANSIENT_ERROR_CODES = new Set(["INTERNAL_SERVER_ERROR", "THROTTLED"]);

function isTransientError(error: GraphQLFormattedError): boolean {
  return TRANSIENT_ERROR_CODES.has(String(error.extensions?.code));
}

export function assertStorefrontOk<T>(
  response: StorefrontResponse<T>,
  operation: string,
): asserts response is { data: T; errors?: GraphQLFormattedError[] } {
  const transientError = response.errors?.find(isTransientError);
  if (response.errors?.length && (!response.data || transientError)) {
    const reportedError = transientError ?? response.errors[0];
    // StorefrontApiError represents transport failures, not returned GraphQL errors.
    throw new Error(`Shopify ${operation} failed: ${reportedError.message}`, {
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
