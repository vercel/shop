import { createHash } from "node:crypto";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = "2025-01";
const DEBUG = process.env.DEBUG_SHOPIFY === "true";

if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
  console.warn(
    "Shopify environment variables not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN.",
  );
}

const baseEndpoint = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)}:${stableSerialize(entryValue)}`,
      )
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function buildVariableCacheKey(variables?: Record<string, unknown>): string {
  if (!variables) return "";

  return createHash("sha1")
    .update(stableSerialize(variables))
    .digest("hex")
    .slice(0, 12);
}

export async function shopifyFetch<T>({
  operation,
  query,
  variables,
}: {
  operation: string;
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const variableCacheKey = buildVariableCacheKey(variables);
  const endpoint = variableCacheKey
    ? `${baseEndpoint}?operation=${operation}&variables=${variableCacheKey}`
    : `${baseEndpoint}?operation=${operation}`;
  const start = DEBUG ? performance.now() : 0;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_ACCESS_TOKEN || "",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify({ query, variables, operationName: operation }),
  });

  if (!response.ok) {
    throw new Error(
      `Shopify API error: ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();

  if (DEBUG) {
    const duration = performance.now() - start;
    const varsPreview = variables
      ? Object.entries(variables)
          .slice(0, 3)
          .map(
            ([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`,
          )
          .join(" ")
      : "";
    console.log(
      `[shopify] ${operation} ${duration.toFixed(0)}ms ${varsPreview}`,
    );
  }

  if (json.errors) {
    if (!json.data) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }
    console.warn(
      `[shopify] ${operation} returned partial errors: ${JSON.stringify(json.errors)}`,
    );
  }

  return json.data;
}
