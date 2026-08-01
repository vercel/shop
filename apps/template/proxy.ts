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

const CART_API_PATH = "/api/cart";

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

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const requestContext = createCustomerRequestContext(request);
  const pathname = request.nextUrl.pathname;

  const isCartPath = pathname === CART_API_PATH;
  const isAuthPath = shopConfig.auth.isEnabled && AUTH_PATHS.has(pathname);

  if (isCartPath || isAuthPath) {
    const handlers: Array<
      typeof cartHandlers | ReturnType<typeof createCustomerAccountServerHandlers>
    > = [cartHandlers];
    if (isAuthPath) {
      handlers.push(
        createCustomerAccountServerHandlers({
          customerSession: await getHydrogenCustomerSession(),
          defaultPostLoginRedirectPathname: "/account",
          origin: getCustomerRequestOrigin,
          postLogoutRedirectUri: "/",
        }),
      );
    }
    const shopifyRoute = await handleShopifyRoutes({
      handlers,
      request,
      requestContext,
      // The session manager is only exercised by the customer-account handlers.
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
    "/((?!api|_next/static|_next/image|_next/data|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
    "/.well-known/:path*",
  ],
};
