import { handleShopifyRoutes } from "@shopify/hydrogen";
import {
  createCustomerAccountServerHandlers,
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
} from "@shopify/hydrogen/customer-account";
import { NextResponse, type NextRequest } from "next/server";

import {
  createCustomerRequestContext,
  createCustomerSessionManager,
  getCustomerRequestOrigin,
  getHydrogenCustomerSession,
} from "@/lib/auth/server";
import { shopConfig } from "@/lib/config";
import { defaultLocale, isEnabledLocale, isLocale } from "@/lib/i18n";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront";

const AUTH_PATHS = new Set<string>([
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
]);

// Hidden locale rewrite: every page request is internally served from the
// `[locale]` segment while the address bar stays clean. The market is chosen by
// the NEXT_LOCALE cookie (set by the nav market picker), falling back to the
// default locale.
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

  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const target = cookieLocale && isEnabledLocale(cookieLocale) ? cookieLocale : defaultLocale;

  const url = new URL(`/${target}${pathname}`, request.url);
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!account/(?:authorize|login|logout|refresh)$|api|md|_next|_vercel|sitemap|robots.txt|llms.txt|.*\\..*).*)",
  ],
};
