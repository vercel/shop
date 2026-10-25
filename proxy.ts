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
} from "@/lib/auth/request";
import { cartHandlers, createCustomerCartHandlers } from "@/lib/cart/request";
import { getRefinedCollectionPath, isRefinedCollectionPath } from "@/lib/collections";
import { shopConfig } from "@/lib/config";
import { getMarkdownRewritePath } from "@/lib/markdown/representation";
import { predictiveSearchHandlers } from "@/lib/search/request";
import { SHOPIFY_ROUTE_TEMPLATES } from "@/lib/shopify/routing";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront/server";

const AUTH_PATHS = new Set<string>([
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
]);

export async function proxy(request: NextRequest): Promise<Response> {
  const pathname = request.nextUrl.pathname;
  const requestContext = createCustomerRequestContext(request);
  const isAuthPath = shopConfig.auth.isEnabled && AUTH_PATHS.has(pathname);
  const customerSession =
    isAuthPath || (shopConfig.auth.isEnabled && pathname === "/api/cart")
      ? await getHydrogenCustomerSession()
      : undefined;

  const routeOptions = {
    request,
    requestContext,
    routeTemplates: SHOPIFY_ROUTE_TEMPLATES,
    storefrontClient: createRequestStorefrontClient(requestContext),
  };
  const shopifyRoute = customerSession
    ? handleShopifyRoutes({
        ...routeOptions,
        handlers: customerHandlers(customerSession, isAuthPath),
        sessionManager: createCustomerSessionManager(request),
      })
    : handleShopifyRoutes({ ...routeOptions, handlers: [cartHandlers, predictiveSearchHandlers] });
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
    // Only named static and metadata files skip the proxy: Shopify's dotted routes and `.md` mirrors must still match.
    "/((?!_next/static|_next/image|_next/data|_vercel|eve(?:/|$)|_eve_internal(?:/|$)|agent/ucp-profile\\.json$|apple-icon\\.png$|favicon\\.ico$|icon\\.svg$|icons/|llms\\.txt$|manifest\\.webmanifest$|og-default\\.png$|robots\\.txt$|sitemap\\.xml$|sitemap/).*)",
  ],
};
