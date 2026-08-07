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

// Hidden rewrite: every page request is internally served from the
// `[flags]/[locale]` segments while the address bar stays clean. The flags
// segment precomputes the storefront flag group into an encrypted code; the
// locale comes from the NEXT_LOCALE cookie (set by the nav market picker),
// falling back to the default locale.
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
  const first = pathname.split("/")[1];
  if (isLocale(first)) return NextResponse.next();

  // evaluate with the request so the toolbar's vercel-flag-overrides cookie is
  // honored; precompute() reads next/headers, which has no request in proxy.
  const values = await evaluate(precomputedFlags, request);
  const code = await serialize(precomputedFlags, precomputedFlags.map((_, i) => values[i]));
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const target = cookieLocale && isEnabledLocale(cookieLocale) ? cookieLocale : defaultLocale;

  const url = new URL(`/${code}/${target}${pathname}`, request.url);
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!account/(?:authorize|login|logout|refresh)$|api|md|_next|_vercel|sitemap|robots.txt|llms.txt|.*\\..*).*)",
  ],
};
