/**
 * Shopify GraphQL Schema Fetcher
 *
 * Fetches GraphQL schemas for Shopify Storefront API and Customer Account API
 * using introspection queries and converts them to SDL format.
 *
 * Usage: bun run .claude/scripts/fetch-shopify-schemas.ts
 */

import { buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_ACCESS_TOKEN =
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const SHOPIFY_CUSTOMER_CLIENT_ID = process.env.SHOPIFY_CUSTOMER_CLIENT_ID;
const SHOPIFY_CUSTOMER_CLIENT_SECRET =
  process.env.SHOPIFY_CUSTOMER_CLIENT_SECRET;
// Optional: Provide a customer access token directly (from logged-in session)
const SHOPIFY_CUSTOMER_ACCESS_TOKEN = process.env.SHOPIFY_CUSTOMER_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = "2025-01";

const SCHEMAS_DIR = join(import.meta.dir, "..", "schemas");

interface IntrospectionResult {
  data: {
    __schema: Parameters<typeof buildClientSchema>[0]["__schema"];
  };
  errors?: Array<{ message: string }>;
}

async function fetchIntrospection(
  endpoint: string,
  headers: Record<string, string>
): Promise<IntrospectionResult> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      query: getIntrospectionQuery(),
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

function introspectionToSDL(introspection: IntrospectionResult): string {
  if (introspection.errors) {
    throw new Error(
      `GraphQL errors: ${introspection.errors.map((e) => e.message).join(", ")}`
    );
  }

  const schema = buildClientSchema(introspection.data);
  return printSchema(schema);
}

async function fetchStorefrontSchema(): Promise<void> {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    console.error(
      "❌ Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_ACCESS_TOKEN"
    );
    console.error("   Set these environment variables and try again.");
    return;
  }

  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

  console.log(`📡 Fetching Storefront API schema from ${SHOPIFY_STORE_DOMAIN}`);

  try {
    const introspection = await fetchIntrospection(endpoint, {
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    });

    const sdl = introspectionToSDL(introspection);
    const outputPath = join(SCHEMAS_DIR, "shopify-storefront.graphql");

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, sdl, "utf-8");

    console.log(`✅ Storefront schema saved to ${outputPath}`);
    console.log(`   ${sdl.split("\n").length} lines`);
  } catch (error) {
    console.error(`❌ Failed to fetch Storefront schema: ${error}`);
  }
}

interface CustomerApiDiscovery {
  graphql_api: string;
  mcp_api?: string;
}

async function discoverCustomerAccountApi(): Promise<{
  graphqlEndpoint: string;
  accountUrl: string;
} | null> {
  if (!SHOPIFY_STORE_DOMAIN) {
    return null;
  }

  const wellKnownUrl = `https://${SHOPIFY_STORE_DOMAIN}/.well-known/customer-account-api`;
  const response = await fetch(wellKnownUrl);

  if (!response.ok) {
    return null;
  }

  const discovery: CustomerApiDiscovery = await response.json();

  if (!discovery.graphql_api) {
    return null;
  }

  // Extract account URL base (e.g., https://shopify.com/12345)
  const match = discovery.graphql_api.match(/^(https:\/\/shopify\.com\/\d+)/);
  if (!match) {
    return null;
  }

  return {
    graphqlEndpoint: discovery.graphql_api,
    accountUrl: match[1],
  };
}

async function getCustomerAccessToken(accountUrl: string): Promise<string> {
  if (!SHOPIFY_CUSTOMER_CLIENT_ID || !SHOPIFY_CUSTOMER_CLIENT_SECRET) {
    throw new Error(
      "Missing SHOPIFY_CUSTOMER_CLIENT_ID or SHOPIFY_CUSTOMER_CLIENT_SECRET"
    );
  }

  const tokenUrl = `${accountUrl}/auth/oauth/token`;

  // Try client credentials grant for introspection access
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: SHOPIFY_CUSTOMER_CLIENT_ID,
    client_secret: SHOPIFY_CUSTOMER_CLIENT_SECRET,
    scope: "https://api.customers.com/auth/customer.graphql",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchCustomerAccountSchema(): Promise<void> {
  console.log(`📡 Fetching Customer Account API schema...`);

  if (!SHOPIFY_STORE_DOMAIN) {
    console.error("❌ Missing SHOPIFY_STORE_DOMAIN");
    return;
  }

  try {
    // Discover the API endpoints
    const discovery = await discoverCustomerAccountApi();
    if (!discovery) {
      console.error("❌ Could not discover Customer Account API endpoints");
      console.error("   The store may not have Customer Account API enabled.");
      return;
    }

    console.log(`   GraphQL endpoint: ${discovery.graphqlEndpoint}`);

    let accessToken: string | undefined;

    // Option 1: Use provided access token
    if (SHOPIFY_CUSTOMER_ACCESS_TOKEN) {
      console.log(`   Using provided SHOPIFY_CUSTOMER_ACCESS_TOKEN`);
      accessToken = SHOPIFY_CUSTOMER_ACCESS_TOKEN;
    }
    // Option 2: Try client credentials (usually doesn't work, but worth trying)
    else if (SHOPIFY_CUSTOMER_CLIENT_ID && SHOPIFY_CUSTOMER_CLIENT_SECRET) {
      console.log(`   Attempting client credentials grant...`);
      try {
        accessToken = await getCustomerAccessToken(discovery.accountUrl);
      } catch (e) {
        console.log(`   Client credentials not supported: ${e}`);
      }
    }

    if (!accessToken) {
      console.error("❌ No access token available for Customer Account API");
      console.error("");
      console.error("   To fetch this schema, set SHOPIFY_CUSTOMER_ACCESS_TOKEN.");
      console.error("   You can get this token by:");
      console.error("   1. Log in to the app at http://localhost:3000");
      console.error("   2. Run this in browser console:");
      console.error("");
      console.error("      // Copy session cookie and decrypt in Node:");
      console.error("      document.cookie.match(/session=([^;]+)/)?.[1]");
      console.error("");
      console.error("   3. Or use the helper endpoint (while logged in):");
      console.error("      curl http://localhost:3000/api/auth/debug-token | jq");
      return;
    }

    // Fetch schema via introspection
    // Note: Shopify Customer Account API uses raw token, not "Bearer " prefix
    console.log(`   Running introspection query...`);
    const introspection = await fetchIntrospection(discovery.graphqlEndpoint, {
      Authorization: accessToken,
    });

    const sdl = introspectionToSDL(introspection);
    const outputPath = join(SCHEMAS_DIR, "shopify-customer.graphql");

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, sdl, "utf-8");

    console.log(`✅ Customer Account schema saved to ${outputPath}`);
    console.log(`   ${sdl.split("\n").length} lines`);
  } catch (error) {
    console.error(`❌ Failed to fetch Customer Account schema: ${error}`);
  }
}

async function main(): Promise<void> {
  console.log("🛒 Shopify GraphQL Schema Fetcher\n");

  await fetchStorefrontSchema();
  console.log("");
  await fetchCustomerAccountSchema();

  console.log("\n📁 Schemas are saved to .claude/schemas/");
  console.log("   These files are gitignored and for local reference only.");
}

main().catch(console.error);
