import "server-only";
import { betterAuth } from "better-auth/minimal";
import { genericOAuth } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;

const SHOPIFY_OIDC_SCOPES = ["openid", "email", "customer-account-api:full"];

function formatVercelUrl(host?: string): string | undefined {
  return host ? `https://${host}` : undefined;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function getAuthBaseUrl(): string {
  const explicitUrl = process.env.BETTER_AUTH_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (explicitUrl) return trimTrailingSlash(explicitUrl);

  if (process.env.VERCEL_ENV === "production") {
    const productionUrl = formatVercelUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
    if (productionUrl) return productionUrl;
  }

  return (
    formatVercelUrl(process.env.VERCEL_BRANCH_URL) ||
    formatVercelUrl(process.env.VERCEL_URL) ||
    "http://localhost:3000"
  );
}

function getTrustedOrigins(authBaseUrl: string): string[] {
  return [
    authBaseUrl,
    formatVercelUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    formatVercelUrl(process.env.VERCEL_BRANCH_URL),
    formatVercelUrl(process.env.VERCEL_URL),
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? []),
  ].reduce<string[]>((origins, origin) => {
    if (!origin) return origins;

    const normalizedOrigin = trimTrailingSlash(origin.trim());
    if (normalizedOrigin && !origins.includes(normalizedOrigin)) {
      origins.push(normalizedOrigin);
    }

    return origins;
  }, []);
}

const authBaseUrl = getAuthBaseUrl();

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
  baseURL: authBaseUrl,
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
  trustedOrigins: getTrustedOrigins(authBaseUrl),
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
  if (!session) redirect("/account/login");

  return session;
}

export async function requireSession(): Promise<FullSession> {
  const session = await getSession();
  if (!session) redirect("/account/login");
  return session;
}
