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
import { cartHandlers, createCustomerCartHandlers } from "@/lib/cart/server";
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
  const usesCustomerCart = shopConfig.auth.isEnabled && (isAuthPath || pathname === "/api/cart");
  const customerSession = usesCustomerCart ? await getHydrogenCustomerSession() : undefined;
  const customerCartHandlers = customerSession
    ? createCustomerCartHandlers(customerSession)
    : undefined;
  const authHandlers =
    isAuthPath && customerSession && customerCartHandlers
      ? createCustomerAccountServerHandlers({
          cartServerHandlers: customerCartHandlers,
          customerSession,
          defaultPostLoginRedirectPathname: "/account",
          origin: getCustomerRequestOrigin,
          postLogoutRedirectUri: "/",
        })
      : undefined;
  const handlers =
    authHandlers && customerCartHandlers
      ? [authHandlers, customerCartHandlers]
      : [customerCartHandlers ?? cartHandlers];
  const shopifyRoute = handleShopifyRoutes({
    handlers,
    request,
    requestContext,
    sessionManager: usesCustomerCart ? createCustomerSessionManager(request) : NOOP_SESSION_MANAGER,
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
    "/api/cart",
    "/api/mcp",
    "/api/:apiVersion(unstable|2\\d{3}-\\d{2})/graphql.json",
    "/__shopify/:path*",
    "/agent/:action(handoff|buyer-claims).:format",
    "/cart.:format(js|json)",
    "/cart/:operation(add|update|change|clear).:format(js|json)",
    "/((?!api|_next/static|_next/image|_next/data|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
    "/.well-known/:path*",
  ],
};
