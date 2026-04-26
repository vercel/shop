---
title: Remove next-intl; tiny in-tree server-only translation
changeKey: remove-next-intl
introducedOn: 2026-04-26
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/lib/i18n/index.ts
  - apps/template/lib/i18n/server.ts
  - apps/template/lib/i18n/error-fallback.ts
  - apps/template/lib/i18n/messages/en.json
  - apps/template/next.config.ts
  - apps/template/package.json
  - apps/template/components/agent/registry.tsx
  - apps/template/components/agent/agent-panel.tsx
  - apps/template/components/agent/agent-button.tsx
  - apps/template/components/agent/agent-button-client.tsx
  - apps/template/components/cart-page/
  - apps/template/components/cart/
  - apps/template/components/collections/
  - apps/template/components/layout/nav/
  - apps/template/components/layout/action-bar/
  - apps/template/components/product-card/
  - apps/template/components/product-detail/
  - apps/template/components/search/results.tsx
  - apps/template/app/
relatedSkills:
  - /vercel-shop:enable-shopify-markets
---

## Summary

`next-intl` is removed from the template. All translation now happens server-side via two thin helpers in `lib/i18n/`:

- `server.ts` — `t(key, params)` and `tNamespace(ns)`. Walk dotted keys, do `{var}` interpolation, resolve ICU `{count, plural, one {…} other {…}}` (whole-template and inline) via `Intl.PluralRules`. Top-of-file `import "server-only"`.
- `index.ts` — universal types (`Namespace`, `NamespaceMessages`, `PluralForms`) derived from `typeof import("./messages/en.json")`, plus a tiny `formatPlural(forms, count, locale, vars?)` for the cases where the count is only known on the client (e.g. optimistic cart).

Client components no longer call hooks. They receive **pre-resolved namespace objects** as props from a server parent (`labels: NamespaceMessages<"cart">`) or per-key flat props for ≤2 keys. The `NextIntlClientProvider` mounts in `app/layout.tsx` and `app/cart/page.tsx` are gone.

The auto-generated `lib/i18n/messages/en.d.json.ts` declaration file is gone too. Types come from `keyof typeof en` — no codegen, no committed artifact.

## Why it matters

- ~30 KB shaved off client bundles (`next-intl` + provider runtime).
- No more agent-vs-codegen tension: the typed-keys story is built on a JSON `typeof` import, so there is no `.d.ts` artifact to forget to commit.
- The `getRequestConfig` indirection and the `global.ts` module augmentation are both deleted.
- Plurals still respect CLDR rules per locale via `Intl.PluralRules`; the parser handles both whole-template plurals (`cart.itemCount`) and inline plurals (`product.inCart`'s "{quantity} {quantity, plural, one {item} other {items}}").
- `agent/registry.tsx` had three hardcoded English strings ("Choose a variant", "Qty:", "Cart (n item/items)") that were never wired through `useTranslations` even before the rip-out. They now use `cart.itemCount` (plural) plus two new `agent.*` keys.

## Migration in this PR

- **New**: `lib/i18n/server.ts` with `t` / `tNamespace`. `lib/i18n/error-fallback.ts` exports a static `ERROR_BOUNDARY_LABELS` because `error.tsx` files must be client components and can't await server resolution.
- **Extended**: `lib/i18n/index.ts` adds `Namespace`, `NamespaceMessages`, `PluralForms`, `formatPlural`. Existing locale/currency/flag helpers untouched.
- **Deleted**: `lib/i18n/request.ts`, `lib/i18n/messages/en.d.json.ts`, `apps/template/global.ts`. `next-intl` removed from `package.json`.
- **next.config.ts**: dropped the `createNextIntlPlugin` wrapper. Plain `export default nextConfig`.
- **Server components (23)**: every `getTranslations("ns")` becomes `t("ns.key", params)` (≤3 keys) or `await tNamespace("ns")` then prop-drill the namespace bag.
- **Client components (18)**: every `useTranslations`/`useLocale` removed; replaced by `labels: NamespaceMessages<"ns">` (or flat per-key props for one or two strings).
- **Hard cases**:
  - `buy-buttons.tsx` receives a small `BuyButtonsLabels` object (server pre-resolves `addingQuantity` as `addingTemplate`; client interpolates `{quantity}` inline).
  - `mobile-menu.tsx` swaps the `showAllLabel(title)` callback for a `showAllTemplate: "Show all {category}"` prop with inline `.replace`.
  - The predictive-search trio (`search-client`, `search-modal`, `predictive-search-results`) all take `labels: NamespaceMessages<"nav">` plus `locale: Locale`. The three `{query}` interpolations happen client-side.
  - `sort-select.tsx` becomes a dumb client component; the server caller pre-translates the eight sort labels via `buildSortOptions(searchLabels, exclude?)` in `components/collections/sort-options.ts`.
  - `agent-panel.tsx` receives `agentLabels`, `cartLabels`, `productLabels`, `locale` as props from a new server `agent-button.tsx` (carved out into `agent-button-client.tsx`). The panel wraps `<JSONUIProvider>` with `<AgentRegistryLabelsProvider>` so registry-component closures in `agent/registry.tsx` can read labels from React Context (the registry is a module-scope singleton, so a context is the cleanest fit).
- **Login page**: `app/account/login/page.tsx` was a client component using `useTranslations`. Carved into a server `page.tsx` (resolves labels) plus `login-client.tsx` (the `useEffect(signIn)` redirect). Suffix follows the AGENTS.md `-client` convention.
- **Two new keys** in `messages/en.json`: `agent.chooseVariant`, `agent.qtyShort` — fixing previously hardcoded English in `agent/registry.tsx`.

## Apply when

- The storefront is single-locale (or hasn't customized `lib/i18n/request.ts` away from the template default).
- The storefront wants the smaller bundle and simpler typed-keys story.

## Safe to skip when

- The storefront has already enabled Shopify Markets / multi-locale via `/vercel-shop:enable-shopify-markets`. That skill installs `next-intl`, recreates `lib/i18n/request.ts`, mounts `NextIntlClientProvider`, and restores client hooks. Multi-locale storefronts should keep `next-intl` because of locale-prefix middleware, hreflang alternates, and CLDR-aware plural/number formatting at the hook level.

## Validation

1. `pnpm install` from the repo root — lockfile shrinks by `next-intl`'s subtree.
2. `pnpm --filter template build` — typecheck and build pass.
3. `git grep -nE "next-intl|useTranslations|getTranslations|useFormatter|getMessages|NextIntlClientProvider" apps/template/` should only match `AGENTS.md` (the rule about `ui/`) and the comment in `lib/i18n/error-fallback.ts`.
4. `ls apps/template/lib/i18n/messages/` shows only `en.json` — no regenerated declaration file.
5. Smoke-test in dev: home, search empty + with query, cart empty + with items, product detail (idle/adding/out-of-stock buy buttons), `/account/login`, account orders/profile/addresses, collection page with filter and sort, `/does-not-exist` (not-found), one of the `error.tsx` boundaries.
6. Plural spot-check: cart with 1 item then 2 items (agent panel cart summary). Search with a niche query returning 1 product (toolbar reads "1 product"); broader query (toolbar reads "N products").
