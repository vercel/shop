import "server-only";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

import { createShopifyRequestContext, type ShopifyRequestContext } from "@shopify/hydrogen";
import {
  createCustomerSession,
  type CustomerSession as HydrogenCustomerSession,
  type ReadonlyCustomerSessionManager,
  type WritableCustomerSessionManager,
} from "@shopify/hydrogen/customer-account";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { isAuthEnabled } from "@/lib/auth";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import { resolveShopId } from "@/lib/shopify/discovery";
import { shopConfig } from "@/shop.config";

const COOKIE_CHUNK_SIZE = 3_800;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
const COOKIE_MAX_CHUNKS = 4;
const COOKIE_NAME = "shop_customer_session";

type SessionData = Record<string, unknown>;

function parseCookies(cookieHeader: string | null): Map<string, string> {
  const cookies = new Map<string, string>();

  for (const entry of cookieHeader?.split(";") ?? []) {
    const separator = entry.indexOf("=");
    if (separator === -1) continue;
    cookies.set(entry.slice(0, separator).trim(), entry.slice(separator + 1).trim());
  }

  return cookies;
}

function getSessionKey(): Buffer {
  const secret = process.env.CUSTOMER_ACCOUNT_SESSION_SECRET;
  if (!secret) {
    throw new Error("CUSTOMER_ACCOUNT_SESSION_SECRET is required when auth is enabled");
  }
  return createHash("sha256").update(secret).digest();
}

function encryptSession(data: SessionData): string {
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getSessionKey(), initializationVector);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  const authenticationTag = cipher.getAuthTag();

  return [initializationVector, authenticationTag, encrypted]
    .map((value) => value.toString("base64url"))
    .join(".");
}

function decryptSession(value: string): SessionData {
  try {
    const [initializationVector, authenticationTag, encrypted] = value
      .split(".")
      .map((part) => Buffer.from(part, "base64url"));
    if (!initializationVector || !authenticationTag || !encrypted) return {};

    const decipher = createDecipheriv("aes-256-gcm", getSessionKey(), initializationVector);
    decipher.setAuthTag(authenticationTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const data: unknown = JSON.parse(decrypted.toString("utf8"));

    return data && typeof data === "object" && !Array.isArray(data) ? (data as SessionData) : {};
  } catch {
    return {};
  }
}

function readSession(cookieHeader: string | null): {
  chunkCount: number;
  data: SessionData;
} {
  const cookies = parseCookies(cookieHeader);
  const chunks: string[] = [];

  for (let index = 0; index < COOKIE_MAX_CHUNKS; index++) {
    const chunk = cookies.get(`${COOKIE_NAME}.${index}`);
    if (!chunk) break;
    chunks.push(chunk);
  }

  return {
    chunkCount: chunks.length,
    data: chunks.length > 0 ? decryptSession(chunks.join("")) : {},
  };
}

function serializeCookie(name: string, value: string, origin: string, maxAge: number): string {
  const secure = new URL(origin).protocol === "https:" ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function createSessionManager(
  cookieHeader: string | null,
  origin: string,
  writable: false,
): ReadonlyCustomerSessionManager;
function createSessionManager(
  cookieHeader: string | null,
  origin: string,
  writable: true,
): WritableCustomerSessionManager;
function createSessionManager(
  cookieHeader: string | null,
  origin: string,
  writable: boolean,
): ReadonlyCustomerSessionManager | WritableCustomerSessionManager {
  const initialSession = readSession(cookieHeader);
  const data = { ...initialSession.data };
  let dirty = false;

  const readonlyManager: ReadonlyCustomerSessionManager = {
    getSessionItem(key) {
      return data[key];
    },
  };

  if (!writable) return readonlyManager;

  return {
    ...readonlyManager,
    getSessionOrigin() {
      return origin;
    },
    removeSessionItem(key) {
      delete data[key];
      dirty = true;
    },
    setSessionItem(key, value) {
      data[key] = value;
      dirty = true;
    },
    commit() {
      if (!dirty) return;

      const responseHeaders = new Headers();
      const encrypted = Object.keys(data).length > 0 ? encryptSession(data) : "";
      const chunks = encrypted.match(new RegExp(`.{1,${COOKIE_CHUNK_SIZE}}`, "g")) ?? [];

      if (chunks.length > COOKIE_MAX_CHUNKS) {
        throw new Error("Customer Account session exceeds the supported cookie size");
      }

      chunks.forEach((chunk, index) => {
        responseHeaders.append(
          "Set-Cookie",
          serializeCookie(`${COOKIE_NAME}.${index}`, chunk, origin, COOKIE_MAX_AGE),
        );
      });

      for (let index = chunks.length; index < COOKIE_MAX_CHUNKS; index++) {
        responseHeaders.append(
          "Set-Cookie",
          serializeCookie(`${COOKIE_NAME}.${index}`, "", origin, 0),
        );
      }

      return responseHeaders;
    },
  };
}

let customerSessionPromise: Promise<HydrogenCustomerSession> | undefined;

export function getHydrogenCustomerSession(): Promise<HydrogenCustomerSession> {
  if (!isAuthEnabled) notFound();

  if (!customerSessionPromise) {
    customerSessionPromise = resolveShopId().then((shopId) =>
      createCustomerSession({
        customerAccountApiClientId: process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID as string,
        shopId,
      }),
    );
  }

  return customerSessionPromise;
}

function getAllowedOrigins(): Set<string> {
  return new Set(
    [
      shopConfig.site.url,
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined,
      process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : undefined,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ].filter((origin): origin is string => Boolean(origin)),
  );
}

export function getCustomerRequestOrigin(request: Request): string {
  const origin = new URL(request.url).origin;
  if (!getAllowedOrigins().has(origin))
    throw new Error("Untrusted Customer Account request origin");
  return origin;
}

export function createCustomerSessionManager(request: Request): WritableCustomerSessionManager {
  return createSessionManager(
    request.headers.get("cookie"),
    getCustomerRequestOrigin(request),
    true,
  );
}

export function createCustomerRequestContext(request: Request): ShopifyRequestContext {
  return createShopifyRequestContext({
    i18n: {
      country: getCountryCode(defaultLocale) as never,
      language: getLanguageCode(defaultLocale) as never,
    },
    request,
  });
}

const getReadonlySessionManager = cache(async (): Promise<ReadonlyCustomerSessionManager> => {
  const requestHeaders = await headers();
  return createSessionManager(requestHeaders.get("cookie"), shopConfig.site.url, false);
});

const getReadonlyRequestContext = cache(async (): Promise<ShopifyRequestContext> => {
  const requestHeaders = await headers();
  return createCustomerRequestContext(
    new Request(shopConfig.site.url, {
      headers: requestHeaders,
    }),
  );
});

export const isCustomerLoggedIn = cache(async (): Promise<boolean> => {
  if (!isAuthEnabled) return false;

  const [customerSession, sessionManager, requestContext] = await Promise.all([
    getHydrogenCustomerSession(),
    getReadonlySessionManager(),
    getReadonlyRequestContext(),
  ]);
  return customerSession.isLoggedIn(sessionManager, requestContext);
});

export const getCustomerAccessToken = cache(async (): Promise<string | undefined> => {
  if (!isAuthEnabled) return undefined;

  const [customerSession, sessionManager, requestContext] = await Promise.all([
    getHydrogenCustomerSession(),
    getReadonlySessionManager(),
    getReadonlyRequestContext(),
  ]);
  return customerSession.getAccessToken(sessionManager, requestContext);
});

export async function requireCustomerSession(): Promise<void> {
  if (!isAuthEnabled) notFound();
  if (!(await isCustomerLoggedIn())) redirect("/account/login?return_to=/account");
}

export async function requireCustomerAccessToken(returnTo = "/account"): Promise<string> {
  if (!isAuthEnabled) notFound();

  const accessToken = await getCustomerAccessToken();
  if (accessToken) return accessToken;

  if (await isCustomerLoggedIn()) {
    redirect(`/account/refresh?return_to=${encodeURIComponent(returnTo)}`);
  }

  redirect(`/account/login?return_to=${encodeURIComponent(returnTo)}`);
}
