import { handleShopifyRoutes } from "@shopify/hydrogen";
import {
  createCustomerAccountServerHandlers,
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
} from "@shopify/hydrogen/customer-account";
import { NextResponse, type NextRequest } from "next/server";

import { isAuthEnabled } from "@/lib/auth";
import {
  createCustomerRequestContext,
  createCustomerSessionManager,
  getCustomerRequestOrigin,
  getHydrogenCustomerSession,
} from "@/lib/auth/server";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront";

const AUTH_PATHS = new Set<string>([
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
]);

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const requestContext = createCustomerRequestContext(request);

  // Only pay for Hydrogen session/route work on the customer-account OAuth paths.
  if (isAuthEnabled && AUTH_PATHS.has(request.nextUrl.pathname)) {
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

  const response = NextResponse.next({
    request: { headers: requestContext.getForwardedRequestHeaders() },
  });
  requestContext.applyResponseHeaders(response.headers);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|.well-known).*)",
  ],
};
