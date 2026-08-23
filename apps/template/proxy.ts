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
import { cartHandlers, createCustomerCartHandlers } from "@/lib/cart/server";
import { shopConfig } from "@/lib/config";
import { precomputedFlags } from "@/lib/flags";
import { defaultLocale, isEnabledLocale, isLocale } from "@/lib/i18n";
import { appendVaryAccept, negotiateRepresentation } from "@/lib/markdown/negotiation";
import { getMarkdownPath } from "@/lib/markdown/routing";
import { predictiveSearchHandlers } from "@/lib/search/server";
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

// Hidden rewrite: serve pages from /[flags]/[locale] while the address bar stays clean.
export async function proxy(request: NextRequest): Promise<Response> {
  const requestContext = createCustomerRequestContext(request);
  const { pathname, search } = request.nextUrl;

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
      ? [authHandlers, customerCartHandlers, predictiveSearchHandlers]
      : [customerCartHandlers ?? cartHandlers, predictiveSearchHandlers];
  const shopifyRoute = handleShopifyRoutes({
    handlers,
    request,
    requestContext,
    sessionManager: usesCustomerCart ? createCustomerSessionManager(request) : NOOP_SESSION_MANAGER,
    storefrontClient: createRequestStorefrontClient(requestContext),
  });
  if (shopifyRoute) return shopifyRoute;

  const first = pathname.split("/")[1];
  if (isLocale(first)) {
    const response = NextResponse.next({
      request: { headers: requestContext.getForwardedRequestHeaders() },
    });
    requestContext.applyResponseHeaders(response.headers);
    return response;
  }

  const markdownPath = getMarkdownPath(pathname);
  if (markdownPath) {
    const representation = negotiateRepresentation(request.headers.get("Accept"));

    if (!representation) {
      return new Response(
        "Not Acceptable\n\nAvailable representations: text/html, text/markdown\n",
        {
          status: 406,
          headers: { "Content-Type": "text/plain; charset=utf-8", Vary: "Accept" },
        },
      );
    }

    if (representation === "text/markdown") {
      const url = request.nextUrl.clone();
      url.pathname = markdownPath;
      const response = NextResponse.rewrite(url, {
        request: { headers: requestContext.getForwardedRequestHeaders() },
      });
      appendVaryAccept(response.headers);
      requestContext.applyResponseHeaders(response.headers);
      return response;
    }
  }

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
  const response = NextResponse.rewrite(url, {
    request: { headers: requestContext.getForwardedRequestHeaders() },
  });
  if (markdownPath) appendVaryAccept(response.headers);
  requestContext.applyResponseHeaders(response.headers);
  return response;
}

export const config = {
  matcher: [
    "/api/cart",
    "/api/predictive-search",
    "/api/mcp",
    "/api/:apiVersion(unstable|2\\d{3}-\\d{2})/graphql.json",
    "/__shopify/:path*",
    "/agent/:action(handoff|buyer-claims).:format",
    "/cart.:format(js|json)",
    "/cart/:operation(add|update|change|clear).:format(js|json)",
    "/((?!api|md|_next/static|_next/image|_next/data|_vercel|favicon.ico|robots.txt|sitemap.xml|llms.txt|.*\\..*).*)",
    "/.well-known/:path*",
  ],
};
