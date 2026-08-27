import { notFound } from "next/navigation";
import "server-only";

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const UCP_PROFILE_URL = `https://${SHOPIFY_STORE_DOMAIN}/.well-known/ucp`;

const FORWARDED_RESPONSE_HEADERS = ["content-type", "etag", "last-modified", "vary"];
const UCP_CACHE_CONTROL = "public, max-age=60";
const UCP_NO_CACHE_CONTROL = "no-store";
const UCP_FETCH_TIMEOUT_MS = 5000;
const NULL_BODY_STATUSES = new Set([204, 304]);

export async function getUcpProfile(request: Request): Promise<Response> {
  if (!SHOPIFY_STORE_DOMAIN) {
    return notFound();
  }

  const requestHeaders = new Headers({ Accept: "application/json" });

  for (const name of ["if-modified-since", "if-none-match"]) {
    const value = request.headers.get(name);
    if (value) requestHeaders.set(name, value);
  }

  let profileResponse: Response;

  try {
    profileResponse = await fetch(UCP_PROFILE_URL, {
      headers: requestHeaders,
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

  const isCacheable = profileResponse.ok || profileResponse.status === 304;
  const headers = new Headers({
    "Cache-Control": isCacheable ? UCP_CACHE_CONTROL : UCP_NO_CACHE_CONTROL,
  });

  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = profileResponse.headers.get(name);
    if (value) headers.set(name, value);
  }

  const body = NULL_BODY_STATUSES.has(profileResponse.status) ? null : profileResponse.body;

  return new Response(body, {
    headers,
    status: profileResponse.status,
    statusText: profileResponse.statusText,
  });
}
