import { notFound } from "next/navigation";
import "server-only";

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const UCP_PROFILE_URL = `https://${SHOPIFY_STORE_DOMAIN}/.well-known/ucp`;

const FORWARDED_RESPONSE_HEADERS = ["content-type", "etag", "last-modified", "vary"];
const UCP_CACHE_CONTROL = "public, max-age=60";

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
    profileResponse = await fetch(UCP_PROFILE_URL, { headers: requestHeaders });
  } catch {
    return Response.json({ error: "Unable to fetch the Shopify UCP profile" }, { status: 502 });
  }

  const headers = new Headers({ "Cache-Control": UCP_CACHE_CONTROL });

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
