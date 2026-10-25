import { createHash, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

import { createShopifyRequestContext, type ShopifyRequestContext } from "@shopify/hydrogen";
import {
  createCustomerSession,
  type ReadonlyCustomerSessionManager,
  type WritableCustomerSessionManager,
} from "@shopify/hydrogen/customer-account";

import { shopConfig } from "@/lib/config";

import type { SessionData } from "./types";

const AUTH_TAG_LENGTH = 16;

const COOKIE_CHUNK_SIZE = 3_800;

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

const COOKIE_MAX_CHUNKS = 4;

const COOKIE_NAME = "shop_customer_session";

export const REFRESH_ATTEMPT_HEADER = "x-customer-refresh-attempted";

export const REFRESH_ATTEMPT_PARAM = "refreshed";

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
  const cipher = createCipheriv("aes-256-gcm", getSessionKey(), initializationVector, {
    authTagLength: AUTH_TAG_LENGTH,
  });
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

    // Without authTagLength, Node accepts a forged tag as short as 4 bytes.
    const decipher = createDecipheriv("aes-256-gcm", getSessionKey(), initializationVector, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authenticationTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const data: unknown = JSON.parse(decrypted.toString("utf8"));

    return data && typeof data === "object" && !Array.isArray(data) ? (data as SessionData) : {};
  } catch {
    return {};
  }
}

function readSession(cookieHeader: string | null): SessionData {
  const cookies = parseCookies(cookieHeader);
  const chunks: string[] = [];

  for (let index = 0; index < COOKIE_MAX_CHUNKS; index++) {
    const chunk = cookies.get(`${COOKIE_NAME}.${index}`);
    if (!chunk) break;
    chunks.push(chunk);
  }

  return chunks.length > 0 ? decryptSession(chunks.join("")) : {};
}

function serializeCookie(name: string, value: string, origin: string, maxAge: number): string {
  const secure = new URL(origin).protocol === "https:" ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function createSessionManager(
  cookieHeader: string | null,
  origin: string,
  writable: false,
): ReadonlyCustomerSessionManager;

export function createSessionManager(
  cookieHeader: string | null,
  origin: string,
  writable: true,
): WritableCustomerSessionManager;

export function createSessionManager(
  cookieHeader: string | null,
  origin: string,
  writable: boolean,
): ReadonlyCustomerSessionManager | WritableCustomerSessionManager {
  const data = { ...readSession(cookieHeader) };
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

let shopifyCustomerSession: ReturnType<typeof createCustomerSession> | undefined;

export function getHydrogenCustomerSession() {
  if (!shopConfig.auth.isEnabled) throw new Error("Customer accounts are not enabled");

  if (!shopifyCustomerSession) {
    const shopId = process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ID as string;
    const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID as string;
    const clientSecret = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_SECRET as string;
    const tokenUrl = `https://shopify.com/authentication/${shopId}/oauth/token`;
    const authenticatedFetch: typeof fetch = (input, init) => {
      const requestUrl = input instanceof Request ? input.url : String(input);
      if (requestUrl !== tokenUrl) return fetch(input, init);

      const requestHeaders = new Headers(input instanceof Request ? input.headers : undefined);
      new Headers(init?.headers).forEach((value, name) => requestHeaders.set(name, value));
      requestHeaders.set(
        "Authorization",
        `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      );
      return fetch(input, { ...init, headers: requestHeaders });
    };

    shopifyCustomerSession = createCustomerSession({
      customerAccountApiClientId: clientId,
      fetch: authenticatedFetch,
      shopId,
    });
  }

  return shopifyCustomerSession;
}

export function getCustomerRequestOrigin(request: Request): string {
  const requestUrl = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    requestUrl.host;
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    requestUrl.protocol.slice(0, -1);

  return new URL(`${protocol}://${host}`).origin;
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
      country: shopConfig.localization.country,
      language: shopConfig.localization.language,
    },
    request,
  });
}

// Server Components cannot read the URL, so the proxy forwards the one-shot refresh marker as a request header.
export function forwardCustomerRefreshAttempt(url: URL, requestHeaders: Headers): Headers {
  requestHeaders.delete(REFRESH_ATTEMPT_HEADER);
  if (url.searchParams.has(REFRESH_ATTEMPT_PARAM)) requestHeaders.set(REFRESH_ATTEMPT_HEADER, "1");
  return requestHeaders;
}
