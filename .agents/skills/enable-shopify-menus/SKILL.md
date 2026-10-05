---
name: enable-shopify-menus
description: Replace the hardcoded nav and footer links with Shopify-managed menus, cached until a protected endpoint refreshes them.
---

# Enable Shopify Menus

By default, the storefront's nav renders an inline `const items: MenuItem[] = [...]` in `Nav` (`components/nav/index.tsx`), and the footer renders an empty `const items: MenuItem[] = []` in `Footer` (`components/footer/index.tsx`). `QuickLinks`, `MobileMenu`, and `Footer`'s `FooterMenu` already render `MenuItem[]` from `lib/menu/types.ts` up to three levels deep.

This skill adds a cached Shopify menu read, points the selected components at it with the inline items as fallback, and adds a protected endpoint that refreshes menus after merchants edit them. Shopify sends no webhook when a menu changes, so menus stay cached until that endpoint is called.

## Before you start

Ask the user two questions in order:

### 1. Which menus do you want to fetch from Shopify?

- **Nav menu** — replaces the hardcoded items used by the desktop quick links and mobile sheet.
- **Footer menu** — adds footer columns.
- **Both**

### 2. What are the Shopify menu handles?

Ask for each selected menu. Defaults: `main-menu` for nav, `footer` for footer. Every Shopify store starts with both.

Wait for the user to answer before proceeding.

---

## 1. Add the menu operation

Create `lib/shopify/operations/menu/server.ts`. Shopify returns absolute item URLs on the store's myshopify or primary domain, sometimes with a Markets locale prefix; the operation turns those into storefront paths and leaves external links alone.

```ts
import { gql } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import type { MenuItem } from "@/lib/menu/types";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { storefront } from "@/lib/shopify/storefront/server";

const GET_MENU_QUERY = gql(`#graphql
  query getMenu($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    shop {
      primaryDomain {
        url
      }
    }
    menu(handle: $handle) {
      items {
        id
        title
        url
        items {
          id
          title
          url
          items {
            id
            title
            url
          }
        }
      }
    }
  }
`);

function toStorefrontUrl(url: string | null | undefined, internalHosts: string[]): string {
  if (!url) return "/";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (!internalHosts.includes(parsed.hostname)) return url;
  const path = parsed.pathname.replace(/^\/[a-z]{2}(?:-[a-z]{2,4})?(?=\/|$)/i, "") || "/";
  return `${path}${parsed.search}${parsed.hash}`;
}

export async function fetchMenu({
  handle,
  locale = shopConfig.localization,
}: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<MenuItem[] | null> {
  const response = await storefront.request(GET_MENU_QUERY, { locale, variables: { handle } });
  assertStorefrontOk(response, "getMenu");

  const menu = response.data.menu;
  if (!menu || menu.items.length === 0) return null;

  const internalHosts = [
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "",
    new URL(response.data.shop.primaryDomain.url).hostname,
  ];
  const link = ({ id, title, url }: { id: string; title: string; url?: string | null }) => ({
    id,
    title,
    url: toStorefrontUrl(url, internalHosts),
  });

  return menu.items.map((item) => ({
    ...link(item),
    items: item.items.map((child) => ({
      ...link(child),
      items: child.items.map((leaf) => ({ ...link(leaf), items: [] })),
    })),
  }));
}
```

If you add fields, validate the document with the Shopify AI Toolkit first.

## 2. Cache the menu

Create `lib/menu/server.ts`:

```ts
import { cacheLife, cacheTag } from "next/cache";

import type { CommerceLocale } from "@/lib/config/types";
import type { MenuItem } from "@/lib/menu/types";
import { fetchMenu } from "@/lib/shopify/operations/menu/server";

export async function getMenu(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<MenuItem[] | null> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("menus");

  return fetchMenu(params);
}
```

## 3. Add the refresh endpoint

Create `app/api/revalidate/menus/route.ts`. It returns `404` until `MENUS_REVALIDATE_SECRET` is set:

```ts
import crypto from "node:crypto";

import { revalidateTag } from "next/cache";

const MENUS_REVALIDATE_SECRET = process.env.MENUS_REVALIDATE_SECRET;

export async function POST(request: Request) {
  if (!MENUS_REVALIDATE_SECRET) return new Response(null, { status: 404 });

  const expected = Buffer.from(`Bearer ${MENUS_REVALIDATE_SECRET}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("menus", { expire: 0 });
  return Response.json({ revalidated: "menus" });
}
```

Add this row to the `# Optional` block of `.env.example`, keeping it alphabetical:

```bash
# MENUS_REVALIDATE_SECRET="your-menus-revalidate-secret-here" # Set when Shopify menus are enabled; send it as a Bearer token to POST /api/revalidate/menus after editing menus.
```

Tell the user to set `MENUS_REVALIDATE_SECRET` in the deployment's environment variables, then refresh menus after editing them in Shopify admin:

```bash
curl -X POST https://your-store.example.com/api/revalidate/menus \
  -H "Authorization: Bearer $MENUS_REVALIDATE_SECRET"
```

Any scheduler or automation that can send that request can refresh menus on a schedule.

## 4. Wire the nav menu

Skip this section if the user did not select the nav menu.

Edit `components/nav/index.tsx`. Make `Nav` async (preserving any existing props in a customized storefront), import `getMenu`, and let the Shopify menu take precedence over the inline default:

```tsx
import { getMenu } from "@/lib/menu/server";
```

```tsx
const items: MenuItem[] = (await getMenu({ handle: "NAV_HANDLE" }).catch(() => null)) ?? [
  { id: "default-nav-shop", items: [], title: "Shop", url: "/collections/all" },
];
```

Replace `"NAV_HANDLE"` with the handle the user provided. `QuickLinks` and `MobileMenu` need no changes.

## 5. Wire the footer menu

Skip this section if the user did not select the footer menu.

Edit `components/footer/index.tsx`. Import `getMenu` and replace `const items: MenuItem[] = [];` with:

```tsx
const items: MenuItem[] = (await getMenu({ handle: "FOOTER_HANDLE" }).catch(() => null)) ?? [];
```

Replace `"FOOTER_HANDLE"` with the handle the user provided. `FooterMenu` needs no changes; an empty or missing menu hides the columns.

## Verification

- The nav and footer render the Shopify menu items, with internal links as storefront paths such as `/collections/all`, and external links unchanged.
- A missing or empty menu falls back to the inline items.
- `POST /api/revalidate/menus` returns `404` without `MENUS_REVALIDATE_SECRET`, `401` with a wrong token, and `200` with the right one.
- Lint, typecheck, and build pass.

## Guardrails

- Keep the inline fallbacks so a missing menu or Storefront error never leaves a blank nav.
- Keep `cacheLife("max")` with the `menus` tag and refresh through the endpoint; do not shorten the cache life to pick up edits.
- In a localized or Markets-enabled store, pass the validated commerce locale to `getMenu` from each caller; do not read locale from request headers inside the cached read.
- New fallback labels belong beside the consuming component; Shopify menu translations and storefront fallback copy are separate.
