// Core better-auth configuration with Shopify Customer Account API OIDC.
// Auth turns on automatically when BETTER_AUTH_SECRET, SHOPIFY_CUSTOMER_CLIENT_ID,
// and SHOPIFY_CUSTOMER_CLIENT_SECRET are all set. See .env.example for setup.
// The universal `isAuthEnabled` flag lives in ./index so client code can import it too.
import "server-only";
import { betterAuth } from "better-auth/minimal";
import { genericOAuth } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getLocale } from "@/lib/params";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;

const SHOPIFY_OIDC_SCOPES = ["openid", "email", "customer-account-api:full"];

function decodeIdTokenPayload(idToken: string): {
  sub: string;
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
} {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid ID token format");
  }

  const payload = parts[1];
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
  const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));

  return JSON.parse(decoded);
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60,
    },
  },

  account: {
    storeStateStrategy: "cookie",
    storeAccountCookie: true,
  },

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "shopify",
          clientId: process.env.SHOPIFY_CUSTOMER_CLIENT_ID ?? "",
          clientSecret: process.env.SHOPIFY_CUSTOMER_CLIENT_SECRET ?? "",
          discoveryUrl: SHOPIFY_STORE_DOMAIN
            ? `https://${SHOPIFY_STORE_DOMAIN}/.well-known/openid-configuration`
            : undefined,
          scopes: SHOPIFY_OIDC_SCOPES,
          pkce: true,
          accessType: "offline",
          getUserInfo: async (tokens) => {
            const idToken = tokens.idToken;
            if (!idToken) {
              throw new Error("No ID token received from Shopify");
            }

            const decoded = decodeIdTokenPayload(idToken);

            const nameParts = [decoded.given_name, decoded.family_name].filter(Boolean);
            let name = nameParts.join(" ");
            if (!name) {
              name = decoded.email?.split("@")[0] || "Customer";
            }

            return {
              id: decoded.sub,
              email: decoded.email,
              emailVerified: decoded.email_verified ?? false,
              name,
              image: undefined,
            };
          },
          mapProfileToUser: (profile) => {
            return {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              image: profile.image,
              emailVerified: profile.emailVerified,
            };
          },
        },
      ],
    }),
  ],

  basePath: "/api/auth",
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") || [],
});

export type Auth = typeof auth;

export interface CustomerSession {
  customerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface FullSession extends CustomerSession {
  accessToken: string;
}

const getAuthSession = cache(async () => {
  const reqHeaders = await headers();
  return auth.api.getSession({ headers: reqHeaders });
});

function mapCustomerSession(
  session: Awaited<ReturnType<typeof getAuthSession>>,
): CustomerSession | null {
  if (!session?.user) return null;

  const [firstName, ...lastParts] = (session.user.name || "").split(" ");

  return {
    customerId: session.user.id,
    email: session.user.email,
    firstName: firstName || undefined,
    lastName: lastParts.join(" ") || undefined,
  };
}

const getAccessToken = cache(async (): Promise<string> => {
  const session = await getAuthSession();
  if (!session?.user) return "";

  const reqHeaders = await headers();

  let accessToken = "";
  try {
    const tokenResponse = await auth.api.getAccessToken({
      headers: reqHeaders,
      body: { providerId: "shopify" },
    });
    accessToken = tokenResponse?.accessToken || "";
  } catch (error) {
    console.error("Failed to get access token:", error);
  }

  return accessToken;
});

export const getCustomerSession = cache(async (): Promise<CustomerSession | null> => {
  const session = await getAuthSession();
  return mapCustomerSession(session);
});

export const getSession = cache(async (): Promise<FullSession | null> => {
  const session = await getCustomerSession();
  if (!session) return null;

  return {
    ...session,
    accessToken: await getAccessToken(),
  };
});

export async function requireCustomerSession(): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session) redirect(`/${await getLocale()}/account/login`);

  return session;
}

export async function requireSession(): Promise<FullSession> {
  const session = await getSession();
  if (!session) redirect(`/${await getLocale()}/account/login`);
  return session;
}
