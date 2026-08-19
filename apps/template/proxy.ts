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
import { cartHandlers } from "@/lib/cart/server";
import { shopConfig } from "@/lib/config";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront";

const AUTH_PATHS = new Set<string>([
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
]);

const NOOP_SESSION_MANAGER = {
  getSessionItem: () => undefined,
  getSessionOrigin: () => "",
  removeSessionItem: () => {},
  setSessionItem: () => {},
};

export async function proxy(request: NextRequest): Promise<Response> {
  const requestContext = createCustomerRequestContext(request);
  const pathname = request.nextUrl.pathname;

  const isAuthPath = shopConfig.auth.isEnabled && AUTH_PATHS.has(pathname);
  const authHandlers = isAuthPath
    ? createCustomerAccountServerHandlers({
        customerSession: await getHydrogenCustomerSession(),
        defaultPostLoginRedirectPathname: "/account",
        origin: getCustomerRequestOrigin,
        postLogoutRedirectUri: "/",
      })
    : undefined;
  const shopifyRoute = handleShopifyRoutes({
    handlers: authHandlers ? [authHandlers, cartHandlers] : [cartHandlers],
    request,
    requestContext,
    sessionManager: isAuthPath ? createCustomerSessionManager(request) : NOOP_SESSION_MANAGER,
    storefrontClient: createRequestStorefrontClient(requestContext),
  });
  if (shopifyRoute) return shopifyRoute;

  const response = NextResponse.next({
    request: { headers: requestContext.getForwardedRequestHeaders() },
  });
  requestContext.applyResponseHeaders(response.headers);
  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!api|_next/static|_next/image|_next/data|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
    "/.well-known/:path*",
  ],
};
