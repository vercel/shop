import { handleShopifyRoutes } from "@shopify/hydrogen";
import {
  createCustomerAccountServerHandlers,
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
} from "@shopify/hydrogen/customer-account";
import { evaluate, serialize } from "flags/next";
import { NextResponse, type NextRequest } from "next/server";

import {
  createCustomerRequestContext,
  createCustomerSessionManager,
  getCustomerRequestOrigin,
  getHydrogenCustomerSession,
} from "@/lib/auth/server";
import { shopConfig } from "@/lib/config";
import { precomputedFlags } from "@/lib/flags";
import { defaultLocale, isEnabledLocale, isLocale } from "@/lib/i18n";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront";

const AUTH_PATHS = new Set<string>([
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
]);

const REMEMBERED_COLLECTION_COOKIE = "state_v0";
const REMEMBERED_COLLECTION_MAX_AGE = 2592000; // 30 days

function matchCollectionHandle(pathname: string): string | undefined {
  const match = pathname.match(/^\/collections\/([^/]+)\/?$/);
  return match?.[1];
}

// Records the viewed collection server-side so the home page's "Picked for You" picks it up
// on the next navigation. Set here (not in a client effect) so the cookie is written on both
// hard loads and client-side navigations, and so a fresh router-cache read always sees it.
function rememberCollection(response: NextResponse, handle: string | undefined): NextResponse {
  if (handle) {
    response.cookies.set(REMEMBERED_COLLECTION_COOKIE, handle, {
      maxAge: REMEMBERED_COLLECTION_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
  }
  return response;
}

// Prefetches (Next-Router-Prefetch) must not count as views: with prefetch on the home
// collection links, hovering/scrolling them would otherwise overwrite the remembered
// collection before the user actually visits one. The header value varies ('1', '2', '3')
// by prefetch kind, so check presence rather than a specific value.
function isPrefetch(request: NextRequest): boolean {
  return request.headers.has("next-router-prefetch");
}

// Hidden rewrite: serve pages from /[flags]/[locale] while the address bar stays clean.
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const requestContext = createCustomerRequestContext(request);

  // Only pay for Hydrogen session/route work on the customer-account OAuth paths.
  if (shopConfig.auth.isEnabled && AUTH_PATHS.has(request.nextUrl.pathname)) {
    const shopifyRoute = await handleShopifyRoutes({
      handlers: [
        createCustomerAccountServerHandlers({
          customerSession: await getHydrogenCustomerSession(),
          defaultPostLoginRedirectPathname: "/account",
          origin: getCustomerRequestOrigin,
          postLogoutRedirectUri: "/",
        }),
      ],
      request,
      requestContext,
      sessionManager: createCustomerSessionManager(request),
      storefrontClient: createRequestStorefrontClient(requestContext),
    });
    if (shopifyRoute) return shopifyRoute as NextResponse;
  }

  const { pathname, search } = request.nextUrl;
  const handle = isPrefetch(request) ? undefined : matchCollectionHandle(pathname);
  const first = pathname.split("/")[1];

  const finish = (response: NextResponse) => {
    if (pathname.startsWith("/collections/")) {
      response.headers.set(
        "x-proxy-debug",
        [
          `prefetch=${request.headers.get("next-router-prefetch") ?? "-"}`,
          `segpref=${request.headers.get("next-router-segment-prefetch") ?? "-"}`,
          `rsc=${request.headers.get("rsc") ?? "-"}`,
          `purpose=${request.headers.get("purpose") ?? "-"}`,
          `secpurpose=${request.headers.get("sec-purpose") ?? "-"}`,
          `rscq=${request.nextUrl.searchParams.has("_rsc") ? "1" : "0"}`,
        ].join("|"),
      );
    }
    return rememberCollection(response, handle);
  };

  if (isLocale(first)) return finish(NextResponse.next());

  // evaluate(request) honors the toolbar override cookie; precompute() has no request in proxy.
  const values = await evaluate(precomputedFlags, request);
  const code = await serialize(
    precomputedFlags,
    precomputedFlags.map((_, i) => values[i]),
  );
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const target = cookieLocale && isEnabledLocale(cookieLocale) ? cookieLocale : defaultLocale;

  const url = new URL(`/${code}/${target}${pathname}`, request.url);
  url.search = search;
  return finish(NextResponse.rewrite(url));
}

export const config = {
  matcher: [
    "/((?!account/(?:authorize|login|logout|refresh)$|api|md|_next|_vercel|sitemap|robots.txt|llms.txt|.*\\..*).*)",
  ],
};
