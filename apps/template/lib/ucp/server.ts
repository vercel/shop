import { notFound } from "next/navigation";
import "server-only";

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const UCP_PROFILE_URL = `https://${SHOPIFY_STORE_DOMAIN}/.well-known/ucp`;

const FORWARDED_RESPONSE_HEADERS = ["content-type", "etag", "last-modified", "vary"];
const UCP_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=300, stale-if-error=86400";
const UCP_NO_CACHE_CONTROL = "no-store";
const UCP_FETCH_TIMEOUT_MS = 5000;

export async function getUcpProfile(request: Request): Promise<Response> {
  if (!SHOPIFY_STORE_DOMAIN) {
    return notFound();
  }

  let profileResponse: Response;

  try {
    profileResponse = await fetch(UCP_PROFILE_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(UCP_FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    const status = error instanceof DOMException && error.name === "TimeoutError" ? 504 : 502;
    return Response.json(
      { error: "Unable to fetch the Shopify UCP profile" },
      { headers: { "Cache-Control": UCP_NO_CACHE_CONTROL }, status },
    );
  }

  if (profileResponse.status === 404 && request.headers.get("accept")?.includes("text/html")) {
    notFound();
  }

  const headers = new Headers({
    "Cache-Control": profileResponse.ok ? UCP_CACHE_CONTROL : UCP_NO_CACHE_CONTROL,
  });

  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = profileResponse.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(profileResponse.body, {
    headers,
    status: profileResponse.status,
    statusText: profileResponse.statusText,
  });
}
