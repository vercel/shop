---
title: Storefront API — adopt @shopify/storefront-api-client + dev/build codegen; isolate the DIY fetcher to the Customer Account API
changeKey: storefront-typed-client
introducedOn: 2026-06-21
changeType: refactor
defaultAction: review
appliesTo:
  - apps/template/lib/shopify/storefront.ts
  - apps/template/lib/shopify/customer-account.ts
  - apps/template/lib/shopify/errors.ts
  - apps/template/lib/shopify/fragments.ts
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/shopify/operations/cart.ts
  - apps/template/lib/shopify/operations/collections.ts
  - apps/template/lib/shopify/operations/search.ts
  - apps/template/lib/shopify/operations/menu.ts
  - apps/template/lib/shopify/operations/sitemap.ts
paths:
  - apps/template/package.json
  - apps/template/.graphqlrc.ts
  - apps/template/.gitignore
  - apps/template/.oxlintrc.json
  - apps/template/.oxfmtrc.json
  - apps/template/tsconfig.json
  - apps/template/lib/shopify/storefront.ts
  - apps/template/lib/shopify/customer-account.ts
  - apps/template/lib/shopify/errors.ts
  - apps/template/lib/shopify/fragments.ts
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/shopify/operations/cart.ts
  - apps/template/lib/shopify/operations/collections.ts
  - apps/template/lib/shopify/operations/search.ts
  - apps/template/lib/shopify/operations/menu.ts
  - apps/template/lib/shopify/operations/sitemap.ts
  - apps/template/lib/shopify/operations/customer.ts
  - apps/docs/content/docs/reference/storefront-api.mdx
  - apps/docs/content/docs/shopify/writing-shopify-queries.mdx
  - packages/plugin/skills/shopify-graphql-reference/SKILL.md
  - packages/plugin/skills/shopify-graphql-reference/references/REFERENCE.md
  - packages/plugin/skills/enable-shopify-cms/SKILL.md
---

## Summary

The Storefront API data layer moved off the hand-rolled `shopifyFetch` (raw `fetch` + hand-written response generics) onto Shopify's first-party tooling, and the leftover DIY fetcher is now isolated to the Customer Account API:

- **Runtime**: a shared `storefront` client (`@shopify/storefront-api-client`) in `lib/shopify/storefront.ts`. A `customFetchApi` wrapper preserves the behaviors the SDK doesn't provide: the `?operation=<name>` URL annotation, `Accept-Encoding: gzip, br`, and `DEBUG_SHOPIFY` timing logs.
- **Validation**: `@shopify/api-codegen-preset` + `graphql-codegen` (config in `.graphqlrc.ts`, schema pulled from Shopify's public direct-proxy for `SHOPIFY_API_VERSION`). Every query/mutation is tagged `#graphql ... as const`; codegen **fails on any unknown field/argument/type**, automating AGENTS.md rule #4.
- **Dev/build codegen, gitignored**: codegen runs as part of the lifecycle, not as a committed artifact. `build` is `graphql-codegen && next build` (a hard gate — the build fails on schema drift); `dev` runs it non-fatally first (`graphql-codegen || true && next dev`) so offline dev still works. The output dir `lib/shopify/types/generated/` is **gitignored** and imported by nothing — it's purely the validation byproduct. This is the key difference from the earlier closed attempt (PR #329), which committed the generated types and ran codegen manually.
- **Error contract**: `assertStorefrontOk(response, operation)` in `lib/shopify/errors.ts` reproduces the old `shopifyFetch` semantics (throw on no-data/GraphQL failure, warn on partial errors) and narrows `response.data` to non-null. `request()` returns `{ data?, errors? }` instead of throwing.
- **Customer Account isolation**: the first-party client can't talk to the Customer Account API (separate endpoint + schema), so `customerAccountFetch` stays hand-rolled — but it now lives in its own server-only module, `lib/shopify/customer-account.ts` (renamed from the mixed `lib/shopify/fetch.ts`, which had its `shopifyFetch` removed). `lib/shopify/operations/customer.ts` is its only importer. Customer operations keep their hand-written response types (structural isolation only — no customer codegen).

Call sites keep their existing hand-written response type, now passed as the explicit `storefront.request<ResponseType>(QUERY, { variables })` generic. Transforms in `lib/shopify/transforms/*` and all `"use cache"`/`cacheTag` wrappers are unchanged — caching behavior is identical, and the cart action layer (`invalidateCartCache`) is untouched.

Two cases the earlier attempt didn't face, surfaced by the data layer's drift since then:

- **Opt-in product metafields** (`getProduct`) had become a dynamically interpolated query (`${cond ? METAFIELD_FRAGMENT : ""}` + a computed `metafields(identifiers: [...])` selection), which codegen can't parse. It's now split into two **static** documents — `GET_PRODUCT_BY_HANDLE_QUERY` (default, no metafields, byte-for-byte the prior query) and `GET_PRODUCT_BY_HANDLE_WITH_METAFIELDS_QUERY` (identifiers passed via a `$metafieldIdentifiers: [HasMetafieldsIdentifier!]!` variable). `getProduct` picks one based on `productMetafieldIdentifiers.length`, so the default empty-config path is unchanged.
- **`WARNINGS_QUERY_FRAGMENT`** (a raw `warnings { ... }` selection snippet, not a valid standalone document) can't be `#graphql`-tagged, so it's inlined into each of the cart mutations.

## Why it matters

- Queries are validated against the live schema at dev/build instead of relying on developer discipline — typos and schema drift become a failed command, not a runtime error.
- The runtime client is first-party and maintained by Shopify, with retries and streaming available if needed later.
- Gitignored, dev/build-time codegen keeps the generated 700KB+ of types out of the tree and guarantees they reflect the pinned API version, while the build gate prevents merging a query that no longer matches the schema.
- The migration is additive to the existing architecture (operations remain the cache boundary; transforms remain the domain boundary), so it composes with i18n, CMS, and other extensions unchanged.

## Apply when

- The storefront wants schema-validated Storefront queries and is willing to let `pnpm build` run codegen (it needs network to Shopify's schema proxy at build).
- The storefront has diverged the `lib/shopify` layer only lightly and can take the data-layer swap wholesale.

## Safe to skip when

- The storefront has heavily customized `shopifyFetch` (custom headers, transport, telemetry) such that re-expressing it through `customFetchApi` is more work than it's worth.
- The storefront's build environment can't reach Shopify's direct-proxy schema and you don't want to vary the dev/build scripts (you could instead commit the generated types and run codegen manually, as PR #329 did).

## Notes

- **Customer Account API is intentionally not codegen-typed.** Codegen *can* cover it via a separate graphql-config project (Hydrogen uses `@shopify/hydrogen-codegen`'s `getSchema('customer-account')`), but that pulls in a Hydrogen-flavored dependency; deferred. The customer fetcher is isolated structurally only.
- **Consuming the generated operation types** (replacing the hand-written `Shopify*` response types and rewriting transforms) is a possible follow-on. It conflicts with gitignored artifacts (app code importing a must-generate-first dir breaks fresh-clone type-check) and is a larger transform rewrite, so it's out of scope here.
- Codegen only resolves interpolations of other `#graphql`-tagged consts by name; keep documents static (variables over interpolation) and inline non-document snippets.
- `@shopify/api-codegen-preset` bundles `@graphql-codegen/cli`, but pnpm doesn't hoist its bin; `@graphql-codegen/cli` is added as a direct dependency so the `codegen` script resolves.
- Generated files under `lib/shopify/types/generated/` are excluded from oxlint, oxfmt, and tsconfig.

## Validation

1. `pnpm --filter template codegen` — succeeds against the live schema; temporarily typo a field and confirm it fails with "Cannot query field …", then revert.
2. `pnpm --filter template exec tsc --noEmit` — 0 errors (including a fresh checkout with no generated dir present).
3. `pnpm --filter template lint` — oxlint + oxfmt clean (generated dir ignored).
4. `pnpm --filter template build` — codegen gate passes, then PDP, collection, search, and sitemap routes prerender under `cacheComponents`.
5. `pnpm --filter template dev` — exercise PDP, PLP/collection, search + predictive search, nav menu, and cart add/update/remove (confirm the cart still updates, i.e. `invalidateCartCache` path intact), plus the authenticated account pages (the Customer Account transport is unchanged, only relocated).
