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
  forwardCustomerRefreshAttempt,
  getCustomerRequestOrigin,
  getHydrogenCustomerSession,
} from "@/lib/auth/server";
import { cartHandlers, createCustomerCartHandlers } from "@/lib/cart/server";
import { getRefinedCollectionPath, isRefinedCollectionPath } from "@/lib/collections";
import { shopConfig } from "@/lib/config";
import { getMarkdownRewritePath } from "@/lib/markdown/representation";
import { predictiveSearchHandlers } from "@/lib/search/server";
import { SHOPIFY_ROUTE_TEMPLATES } from "@/lib/shopify/routing";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront/server";

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
  const pathname = request.nextUrl.pathname;
  const requestContext = createCustomerRequestContext(request);
  const isAuthPath = shopConfig.auth.isEnabled && AUTH_PATHS.has(pathname);
  const customerSession =
    isAuthPath || (shopConfig.auth.isEnabled && pathname === "/api/cart")
      ? await getHydrogenCustomerSession()
      : undefined;

  const shopifyRoute = handleShopifyRoutes({
    handlers: customerSession
      ? customerHandlers(customerSession, isAuthPath)
      : [cartHandlers, predictiveSearchHandlers],
    request,
    requestContext,
    routeTemplates: SHOPIFY_ROUTE_TEMPLATES,
    sessionManager: customerSession ? createCustomerSessionManager(request) : NOOP_SESSION_MANAGER,
    storefrontClient: createRequestStorefrontClient(requestContext),
  });
  if (shopifyRoute) return shopifyRoute;
  if (isRefinedCollectionPath(pathname)) return new Response("Not Found", { status: 404 });

  const headers = requestContext.getForwardedRequestHeaders();
  const rewritePath =
    getMarkdownRewritePath(request) ?? getRefinedCollectionPath(pathname, request.nextUrl.search);
  const response = rewritePath
    ? NextResponse.rewrite(new URL(`${rewritePath}${request.nextUrl.search}`, request.url), {
        request: { headers },
      })
    : NextResponse.next({
        request: { headers: forwardCustomerRefreshAttempt(request.nextUrl, headers) },
      });
  requestContext.applyResponseHeaders(response.headers);
  return response;
}

function customerHandlers(
  customerSession: Awaited<ReturnType<typeof getHydrogenCustomerSession>>,
  isAuthPath: boolean,
) {
  const cart = createCustomerCartHandlers(customerSession);
  if (!isAuthPath) return [cart, predictiveSearchHandlers];

  const auth = createCustomerAccountServerHandlers({
    cartServerHandlers: cart,
    customerSession,
    defaultPostLoginRedirectPathname: "/account",
    loginFailedRedirectPath: "/account/sign-in-failed",
    origin: getCustomerRequestOrigin,
    postLogoutRedirectUri: "/",
  });
  return [auth, cart, predictiveSearchHandlers];
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|_vercel|eve(?:/|$)|_eve_internal(?:/|$)|favicon.ico).*)",
  ],
};
