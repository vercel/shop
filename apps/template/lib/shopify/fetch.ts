const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN as string;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN as string;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-04";
const DEBUG = process.env.DEBUG_SHOPIFY === "true";

const baseEndpoint = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const customerEndpoint = `https://${SHOPIFY_STORE_DOMAIN}/customer/api/${SHOPIFY_API_VERSION}/graphql`;

export async function shopifyFetch<T>({
  operation,
  query,
  variables,
}: {
  operation: string;
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const endpoint = `${baseEndpoint}?operation=${operation}`;
  const start = DEBUG ? performance.now() : 0;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_ACCESS_TOKEN,
      "Accept-Encoding": "gzip, br",
    },
    body: JSON.stringify({ query, variables, operationName: operation }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (DEBUG) {
    const duration = performance.now() - start;
    const varsPreview = variables
      ? Object.entries(variables)
          .slice(0, 3)
          .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
          .join(" ")
      : "";
    console.log(`[shopify] ${operation} ${duration.toFixed(0)}ms ${varsPreview}`);
  }

  if (json.errors) {
    if (!json.data) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }
    console.warn(`[shopify] ${operation} returned partial errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

// Customer Account API is a separate GraphQL endpoint and schema from the
// Storefront API. It authenticates with the customer's OAuth access token sent
// as the raw `Authorization` header value (no `Bearer` prefix) and is always
// per-request (POST), so responses are never shared across customers.
export async function customerAccountFetch<T>({
  accessToken,
  operation,
  query,
  variables,
}: {
  accessToken: string;
  operation: string;
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const endpoint = `${customerEndpoint}?operation=${operation}`;
  const start = DEBUG ? performance.now() : 0;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
      "Accept-Encoding": "gzip, br",
    },
    body: JSON.stringify({ query, variables, operationName: operation }),
  });

  if (!response.ok) {
    throw new Error(`Shopify Customer API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (DEBUG) {
    const duration = performance.now() - start;
    console.log(`[shopify:customer] ${operation} ${duration.toFixed(0)}ms`);
  }

  if (json.errors) {
    if (!json.data) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }
    console.warn(
      `[shopify:customer] ${operation} returned partial errors: ${JSON.stringify(json.errors)}`,
    );
  }

  return json.data;
}
