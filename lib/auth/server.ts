import type { ShopifyRequestContext } from "@shopify/hydrogen";
import type { ReadonlyCustomerSessionManager } from "@shopify/hydrogen/customer-account";
import { io } from "next/cache";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { shopConfig } from "@/lib/config";

import {
  createCustomerRequestContext,
  createSessionManager,
  getHydrogenCustomerSession,
  REFRESH_ATTEMPT_HEADER,
  REFRESH_ATTEMPT_PARAM,
} from "./request";

export const getReadonlyCustomerSessionManager = cache(
  async (): Promise<ReadonlyCustomerSessionManager> => {
    const requestHeaders = await headers();
    return createSessionManager(requestHeaders.get("cookie"), shopConfig.site.url, false);
  },
);

const getReadonlyRequestContext = cache(async (): Promise<ShopifyRequestContext> => {
  await io();
  const requestHeaders = await headers();
  return createCustomerRequestContext(
    new Request(shopConfig.site.url, {
      headers: requestHeaders,
    }),
  );
});

export const isCustomerLoggedIn = cache(async (): Promise<boolean> => {
  if (!shopConfig.auth.isEnabled) return false;

  const [customerSession, sessionManager, requestContext] = await Promise.all([
    getHydrogenCustomerSession(),
    getReadonlyCustomerSessionManager(),
    getReadonlyRequestContext(),
  ]);
  return customerSession.isLoggedIn(sessionManager, requestContext);
});

export const getCustomerAccessToken = cache(async (): Promise<string | undefined> => {
  if (!shopConfig.auth.isEnabled) return undefined;

  const [customerSession, sessionManager, requestContext] = await Promise.all([
    getHydrogenCustomerSession(),
    getReadonlyCustomerSessionManager(),
    getReadonlyRequestContext(),
  ]);
  return customerSession.getAccessToken(sessionManager, requestContext);
});

export function redirectToCustomerLogin(returnTo: string): never {
  redirect(`/account/login?return_to=${encodeURIComponent(returnTo)}`);
}

async function getRequestedPath(fallback: string): Promise<string> {
  const url = (await headers()).get("x-storefront-url");
  if (!url) return fallback;
  const requested = new URL(url);
  requested.searchParams.delete("_rsc");
  requested.searchParams.delete(REFRESH_ATTEMPT_PARAM);
  return `${requested.pathname}${requested.search}`;
}

export async function requireCustomerSession(): Promise<void> {
  if (!shopConfig.auth.isEnabled) notFound();
  if (!(await isCustomerLoggedIn())) redirectToCustomerLogin(await getRequestedPath("/account"));
}

function withRefreshAttempt(path: string): string {
  const url = new URL(path, shopConfig.site.url);
  url.searchParams.set(REFRESH_ATTEMPT_PARAM, "1");
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function requireCustomerAccessToken(returnTo = "/account"): Promise<string> {
  if (!shopConfig.auth.isEnabled) notFound();

  const accessToken = await getCustomerAccessToken();
  if (accessToken) return accessToken;

  // Hydrogen returns to the page unchanged after a transient refresh failure, so a second refresh would loop.
  const refreshAttempted = (await headers()).has(REFRESH_ATTEMPT_HEADER);
  if (!refreshAttempted && (await isCustomerLoggedIn())) {
    redirect(`/account/refresh?return_to=${encodeURIComponent(withRefreshAttempt(returnTo))}`);
  }

  redirectToCustomerLogin(returnTo);
}
