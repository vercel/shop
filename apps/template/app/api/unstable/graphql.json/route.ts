import { NextResponse } from "next/server";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN as string;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN as string;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "unstable";

const FORWARDED_HEADERS = ["x-shopify-uniquetoken", "x-shopify-visittoken"];

// Same-origin proxy for the Shopify analytics consent handshake. The browser posts here
// (no token); the server injects the Storefront token so it never ships to the client.
export async function POST(request: Request): Promise<Response> {
  const body = await request.text();

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("X-Shopify-Storefront-Access-Token", SHOPIFY_ACCESS_TOKEN);
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const response = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`,
    { body, headers, method: "POST" },
  );

  const responseHeaders = new Headers({ "Content-Type": "application/json" });
  response.headers.forEach((value, name) => {
    if (name.toLowerCase() === "set-cookie") responseHeaders.append("set-cookie", value);
  });

  return new NextResponse(response.body, {
    headers: responseHeaders,
    status: response.status,
  });
}
