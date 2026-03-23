---
name: enable-shopify-customer-accounts
description: >
  Enable Shopify Customer Accounts with login, account pages (profile, orders,
  addresses), and nav integration using better-auth with Shopify OIDC.
argument-hint: "[profile|orders|addresses]"
---

# Enable Shopify Customer Accounts

## Description

Add customer authentication using [better-auth](https://www.better-auth.com/) with Shopify Customer Account API OIDC. This enables customer login, profile management, order history, and address book. Features are modular — pick what you need.

## When to Use This Skill

- When the user wants to add customer login / sign-in to their storefront
- When the user wants account pages (profile, orders, addresses)
- When the user wants authenticated checkout (cart linked to customer)
- When invoked via `/enable-shopify-customer-accounts`

## Prerequisites

- Shopify store with **Customer Account API** enabled (Shopify Admin → Settings → Customer accounts)
- Customer Account API credentials (client ID + client secret)
- A `AUTH_SECRET` value for session signing (generate with `openssl rand -base64 32`)

## Required environment variables

| Variable                         | Description                                                      |
| -------------------------------- | ---------------------------------------------------------------- |
| `AUTH_SECRET`                    | Secret for signing sessions (also known as `BETTER_AUTH_SECRET`) |
| `SHOPIFY_CUSTOMER_CLIENT_ID`     | Shopify Customer Account API client ID                           |
| `SHOPIFY_CUSTOMER_CLIENT_SECRET` | Shopify Customer Account API client secret                       |
| `BETTER_AUTH_BASE_URL`           | App base URL (e.g. `http://localhost:3000` for dev)              |
| `SHOPIFY_STORE_DOMAIN`           | Already set — used for OIDC discovery                            |

---

## Step 0: Gather User Preferences

If the user hasn't already specified their preferences, ask them. Use a single round of questions.

```json
{
  "questions": [
    {
      "question": "Which account features do you need?",
      "header": "Features",
      "multiSelect": true,
      "options": [
        {
          "label": "Profile management",
          "description": "View and edit customer name and email"
        },
        {
          "label": "Order history",
          "description": "List orders with status filters and detail pages with fulfillment tracking"
        },
        {
          "label": "Address book",
          "description": "Full CRUD for saved shipping addresses"
        },
        {
          "label": "Authenticated checkout",
          "description": "Link the cart to the logged-in customer before redirecting to Shopify checkout"
        }
      ]
    },
    {
      "question": "Should auth context be wired into the AI chat route?",
      "header": "Chat",
      "multiSelect": false,
      "options": [
        {
          "label": "Yes (Recommended)",
          "description": "Pass the authenticated customer's identity and access token to the chat route so the agent can make personalized queries"
        },
        {
          "label": "No",
          "description": "Keep the chat route guest-only — skip Step 13"
        }
      ]
    }
  ]
}
```

Based on the answers:

- **Core auth** (Steps 1–8, 11, 14) is always implemented — this gives you better-auth setup, the login page, nav integration, and translation keys.
- **Profile management** → include profile page and components in Step 10 and customer `getCustomer`/`updateCustomer` operations in Step 9.
- **Order history** → include orders pages in Step 10 and `getOrders`/`getOrder` operations in Step 9.
- **Address book** → include addresses page in Step 10 and address CRUD operations in Step 9.
- **Authenticated checkout** → include Step 12.
- **Chat context** → include Step 13.

If the user selects none of the account features, skip Steps 9–10 entirely and create a minimal `/account` page that just shows the customer's name/email with a sign-out button.

---

## Implementation steps

### Step 1. Install better-auth

```bash
pnpm add better-auth
```

### Step 2. Update `next.config.ts`

Add `better-auth` to `serverExternalPackages`:

```ts
const nextConfig: NextConfig = {
  // ... existing config
  serverExternalPackages: ["better-auth"],
};
```

### Step 3. Update `turbo.json`

Add auth env vars to `globalEnv`:

```json
{
  "globalEnv": [
    "BETTER_AUTH_SECRET",
    "SHOPIFY_CUSTOMER_ACCOUNT_URL",
    "SHOPIFY_CUSTOMER_CLIENT_ID",
    "SHOPIFY_CUSTOMER_CLIENT_SECRET"
  ]
}
```

### Step 4. Create `lib/auth/auth.ts`

Core better-auth configuration with Shopify OIDC:

```ts
import { betterAuth } from "better-auth/minimal";
import { genericOAuth } from "better-auth/plugins";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;

if (!SHOPIFY_STORE_DOMAIN) {
  console.warn("[better-auth] SHOPIFY_STORE_DOMAIN not set - auth will not work");
}

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
  secret: process.env.AUTH_SECRET,

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
```

### Step 5. Create `lib/auth/server.ts`

Server-side session helpers with React cache for per-request memoization:

```ts
import { auth } from "./auth";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export { auth };

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
  if (!session) redirect("/login");

  return session;
}

export async function requireSession(): Promise<FullSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
```

### Step 6. Create `lib/auth/client.ts`

Client-side auth hooks and actions:

```ts
"use client";

import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { CustomerSession } from "./server";

export const authClient = createAuthClient({
  plugins: [genericOAuthClient()],
});

export interface SessionState {
  loading: boolean;
  authenticated: boolean;
  customer: CustomerSession | null;
}

export function useSession(): SessionState {
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return { loading: true, authenticated: false, customer: null };
  }

  if (!data?.user) {
    return { loading: false, authenticated: false, customer: null };
  }

  const [firstName, ...lastParts] = (data.user.name || "").split(" ");

  return {
    loading: false,
    authenticated: true,
    customer: {
      customerId: data.user.id,
      email: data.user.email,
      firstName: firstName || undefined,
      lastName: lastParts.join(" ") || undefined,
    },
  };
}

export function signIn(callbackURL = "/account"): void {
  authClient.signIn.oauth2({ providerId: "shopify", callbackURL });
}

export async function signOut(): Promise<void> {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/";
      },
    },
  });
}
```

### Step 7. Create `app/api/auth/[...all]/route.ts`

```ts
import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Step 8. Create login page

**`app/login/layout.tsx`**:

```tsx
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  return {
    title: t("loginTitle"),
    robots: { index: false, follow: false },
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

**`app/login/page.tsx`**:

```tsx
"use client";

import { useEffect } from "react";
import { signIn } from "@/lib/auth/client";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("common");

  useEffect(() => {
    signIn("/account");
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">{t("loginRedirecting")}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("loginNotRedirected")}{" "}
          <button type="button" onClick={() => signIn("/account")} className="underline">
            {t("loginClickHere")}
          </button>
        </p>
      </div>
    </div>
  );
}
```

### Step 9. Create customer operations

Create `lib/shopify/types/customer.ts` with domain types for Customer, Address, Order, Fulfillment, and related types.

Create `lib/shopify/operations/customer.ts` with:

- `discoverCustomerApiEndpoint()` — auto-discovers GraphQL endpoint from `.well-known/customer-account-api`
- `customerApiFetch()` — GraphQL client with Bearer token auth
- `getCustomer(accessToken)` — profile data
- `getOrders(accessToken, options)` — paginated orders
- `getOrder(accessToken, orderId)` — single order detail
- `getAddresses(accessToken)` — address book
- `updateCustomer(accessToken, input)` — profile mutation
- `createAddress(accessToken, address)` — add address
- `updateAddress(accessToken, addressId, address)` — edit address
- `deleteAddress(accessToken, addressId)` — remove address
- `setDefaultAddress(accessToken, addressId)` — set default

Reference `.claude/schemas/shopify-customer.graphql` for field names. All operations use the Customer Account API (separate from Storefront API) with OAuth Bearer tokens.

### Step 10. Create account pages and components

Create the account section with this structure:

```
app/account/
  layout.tsx      — Responsive layout with sidebar (desktop) and tabs (mobile)
  page.tsx        — Redirect to /account/profile
  error.tsx       — Error boundary
  profile/page.tsx — Profile display with inline edit
  orders/page.tsx  — Order list with status filters
  orders/[id]/page.tsx — Order detail with fulfillment tracking
  addresses/page.tsx — Address book CRUD

components/account/
  actions.ts       — Server action for profile update
  sidebar.tsx      — Navigation sidebar with profile/orders/addresses links
  sidebar-client.tsx — Active state detection for sidebar items
  mobile-tabs.tsx  — Mobile tab navigation
  mobile-tabs-client.tsx — Client-side mobile tab state
  page-header.tsx  — Breadcrumb + title layout
  profile-section.tsx — Profile UI primitives
  profile-section-composed.tsx — Async composed profile section
  profile-edit-form.tsx — Sheet-based profile edit form
  profile-edit-inline.tsx — Inline profile edit form
  profile-page-skeleton.tsx — Loading skeleton
  client.tsx       — ProfileEditToggle client component

components/addresses/
  actions.ts       — Server actions for address CRUD
  address-form.tsx — Address form with country select
  address-card.tsx — Address card display
```

All account pages must call `requireSession()` or `requireCustomerSession()` before rendering. The layout uses `getTranslations("account")` for i18n.

### Step 11. Wire nav account component

Create `components/layout/nav/account.tsx`:

```tsx
import { AccountClient } from "./account-client";
import { getCustomerSession } from "@/lib/auth/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { UserIcon } from "lucide-react";

export async function NavAccount() {
  const [session, t] = await Promise.all([getCustomerSession(), getTranslations("nav")]);

  if (!session) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-3 py-2 hover:opacity-70 focus-visible:opacity-70 transition-opacity outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-full"
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <UserIcon className="w-4 h-4" />
        </div>
        <div className="hidden lg:flex flex-col leading-tight w-18">
          <span className="text-xs font-semibold text-foreground">{t("account")}</span>
          <span className="text-xs text-muted-foreground">{t("signIn")}</span>
        </div>
      </Link>
    );
  }

  return (
    <AccountClient
      email={session.email}
      translations={{
        account: t("account"),
        profile: t("profile"),
        orders: t("orders"),
        signOut: t("signOut"),
      }}
    />
  );
}
```

Create `components/layout/nav/account-client.tsx` with a dropdown menu showing profile/orders links and sign-out. Create `components/layout/nav/sign-out-button.tsx` as a standalone sign-out button.

Then add to `components/layout/nav/index.tsx`:

```tsx
import { NavAccount } from "./account";
// ... in the nav bar, inside the actions div:
<Suspense fallback={<AccountFallback />}>
  <NavAccount />
</Suspense>;
```

### Step 12. Wire cart actions for authenticated checkout

In `components/cart/actions.ts`, import `getSession` and update:

- `buyNowAction`: Run `addToCart` and `getSession` in parallel. If authenticated, call `linkCartToCustomer(session.accessToken)` before returning checkout URL.
- `prepareCheckoutAction`: Check session, if authenticated call `linkCartToCustomer(session.accessToken)`, fall back to plain cart checkout URL.

### Step 13. Wire chat context for authenticated users

In `app/api/chat/route.ts`, add a `resolveUser` function:

```ts
import { getSession } from "@/lib/auth/server";

async function resolveUser(locale: Locale): Promise<User> {
  try {
    const session = await getSession();
    if (session?.accessToken) {
      return {
        type: "user",
        locale,
        id: session.customerId,
        email: session.email,
        name: [session.firstName, session.lastName].filter(Boolean).join(" "),
        accessToken: session.accessToken,
      };
    }
  } catch {
    // Fall through to guest
  }

  return { type: "guest", locale };
}
```

Update `lib/agent/context.ts` to include the authenticated user variant in the `User` type:

```ts
export type User =
  | { type: "guest"; locale: Locale }
  | {
      type: "user";
      locale: Locale;
      id: string;
      email: string;
      name: string;
      accessToken: string;
    };
```

### Step 14. Add translation keys

Add to ALL locale files under `nav`:

- `signIn`, `signOut`, `profile`, `orders`

Add `seo.loginTitle`.

Add `common.loginRedirecting`, `common.loginNotRedirected`, `common.loginClickHere`.

Add full `account`, `orders`, and `address` sections. See the base `en.json` translations for the complete key set.

---

## Shopify Admin setup

1. Go to **Shopify Admin → Settings → Customer accounts**
2. Enable **Customer Account API**
3. Create a **Customer Account API client** (under "API clients")
4. Set the redirect URI to `{YOUR_DOMAIN}/api/auth/callback/shopify`
5. Copy the client ID and client secret to your environment variables
6. Ensure the store domain matches `SHOPIFY_STORE_DOMAIN`

## Guardrails

- Never expose access tokens to the client — `getSession()` and `requireSession()` are server-only
- Always call `requireSession()` before any customer API operation
- The Customer Account API uses a separate GraphQL endpoint from the Storefront API — always reference `.claude/schemas/shopify-customer.graphql`
- Session cookies use `httpOnly` and `secure` flags automatically via better-auth
- The login page uses `robots: { index: false, follow: false }` to prevent indexing
- PKCE is enabled for the OAuth flow — never disable it

## Verification

After completing all steps, verify the implementation:

1. **Build**: Run `pnpm build` and confirm no TypeScript errors
2. **Smoke test**: Run `pnpm dev` and check:
   - Visiting `/login` redirects to Shopify's OIDC login page
   - After login, the nav shows the account dropdown with the customer's email
   - Visiting `/account` while logged out redirects to `/login`
3. **Account pages** (if enabled): Confirm profile displays customer data, orders list loads, and address CRUD works
4. **Authenticated checkout** (if enabled): Add an item to cart, proceed to checkout, and confirm the cart is linked to the customer
5. **Session**: Confirm sign-out clears the session and redirects to `/`
