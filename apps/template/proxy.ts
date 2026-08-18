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
import { createRequestStorefrontClient } from "@/lib/shopify/storefront";

const AUTH_PATHS = new Set<string>([
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
]);

const SFAPI_PATH = /^\/api\/(?:unstable|2\d{3}-\d{2})\/graphql\.json$/;

const NOOP_SESSION_MANAGER = {
  getSessionItem: () => undefined,
  getSessionOrigin: () => "",
  removeSessionItem: () => {},
  setSessionItem: () => {},
};

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const requestContext = createCustomerRequestContext(request);
  const pathname = request.nextUrl.pathname;

  // /api/cart is deliberately NOT registered here: its App Router route handler owns the
  // request (BotID gate + response shaping). Passing cartHandlers to handleShopifyRoutes
  // would short-circuit the proxy and the route handler would never run.
  const isAuthPath = shopConfig.auth.isEnabled && AUTH_PATHS.has(pathname);
  const isSfapiPath = SFAPI_PATH.test(pathname);

  if (isAuthPath || isSfapiPath) {
    const handlers = isAuthPath
      ? [
          createCustomerAccountServerHandlers({
            customerSession: await getHydrogenCustomerSession(),
            defaultPostLoginRedirectPathname: "/account",
            origin: getCustomerRequestOrigin,
            postLogoutRedirectUri: "/",
          }),
        ]
      : [];
    const shopifyRoute = await handleShopifyRoutes({
      handlers,
      request,
      requestContext,
      sessionManager: isAuthPath ? createCustomerSessionManager(request) : NOOP_SESSION_MANAGER,
      storefrontClient: createRequestStorefrontClient(requestContext),
    });
    if (shopifyRoute) return shopifyRoute as NextResponse;
  }

  const response = NextResponse.next({
    request: { headers: requestContext.getForwardedRequestHeaders() },
  });
  requestContext.applyResponseHeaders(response.headers);
  return response;
}

export const config = {
  matcher: [
    "/api/cart",
    "/api/:apiVersion(unstable|2\\d{3}-\\d{2})/graphql.json",
    "/((?!api|_next/static|_next/image|_next/data|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
    "/.well-known/:path*",
  ],
};
