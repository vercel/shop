import { handleShopifyRoutes } from "@shopify/hydrogen";
import {
  createCustomerAccountServerHandlers,
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
} from "@shopify/hydrogen/customer-account";

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

async function handleAuthRequest(request: Request): Promise<Response> {
  if (!isAuthEnabled || !AUTH_PATHS.has(new URL(request.url).pathname)) {
    return new Response(null, { status: 404 });
  }

  const requestContext = createCustomerRequestContext(request);
  const sessionManager = createCustomerSessionManager(request);
  const storefrontClient = createRequestStorefrontClient(requestContext);
  const customerSession = await getHydrogenCustomerSession();
  const response = await handleShopifyRoutes({
    handlers: [
      createCustomerAccountServerHandlers({
        customerSession,
        defaultPostLoginRedirectPathname: "/account",
        origin: getCustomerRequestOrigin,
        postLogoutRedirectUri: "/",
      }),
    ],
    request,
    requestContext,
    sessionManager,
    storefrontClient,
  });

  return response ?? new Response(null, { status: 404 });
}

export const GET = handleAuthRequest;
export const POST = handleAuthRequest;
