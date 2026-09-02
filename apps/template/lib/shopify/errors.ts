import { StorefrontApiError, type GraphQLFormattedError } from "@shopify/hydrogen";

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
