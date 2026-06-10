---
title: Storefront API — adopt @shopify/storefront-api-client + codegen
changeKey: storefront-typed-client
introducedOn: 2026-06-10
changeType: refactor
defaultAction: review
appliesTo:
  - apps/template/lib/shopify/storefront.ts
  - apps/template/lib/shopify/fetch.ts
  - apps/template/lib/shopify/fragments.ts
  - apps/template/lib/shopify/errors.ts
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/shopify/operations/cart.ts
  - apps/template/lib/shopify/operations/collections.ts
  - apps/template/lib/shopify/operations/search.ts
  - apps/template/lib/shopify/operations/menu.ts
  - apps/template/lib/shopify/operations/sitemap.ts
  - apps/docs/content/docs/reference/storefront-api.mdx
  - apps/docs/content/docs/shopify/writing-shopify-queries.mdx
paths:
  - apps/template/package.json
  - apps/template/.graphqlrc.ts
  - apps/template/.oxlintrc.json
  - apps/template/.oxfmtrc.json
  - apps/template/lib/shopify/storefront.ts
  - apps/template/lib/shopify/fetch.ts
  - apps/template/lib/shopify/errors.ts
  - apps/template/lib/shopify/fragments.ts
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/shopify/operations/cart.ts
  - apps/template/lib/shopify/operations/collections.ts
  - apps/template/lib/shopify/operations/search.ts
  - apps/template/lib/shopify/operations/menu.ts
  - apps/template/lib/shopify/operations/sitemap.ts
  - apps/template/lib/shopify/types/generated/
  - apps/docs/content/docs/reference/storefront-api.mdx
  - apps/docs/content/docs/shopify/writing-shopify-queries.mdx
  - apps/docs/content/docs/skills/enable-shopify-cms.mdx
  - packages/plugin/skills/shopify-graphql-reference/SKILL.md
  - packages/plugin/skills/shopify-graphql-reference/references/REFERENCE.md
  - packages/plugin/skills/enable-shopify-cms/SKILL.md
---

## Summary

The Storefront API data layer moved off the hand-rolled `shopifyFetch` (raw `fetch` + hand-written response generics) onto Shopify's first-party tooling:

- **Runtime**: a shared `storefront` client (`@shopify/storefront-api-client`) in `lib/shopify/storefront.ts`. A `customFetchApi` wrapper preserves the prior behaviors the SDK doesn't provide: the `?operation=<name>` URL annotation, `Accept-Encoding: gzip, br`, and `DEBUG_SHOPIFY` timing logs.
- **Validation**: `@shopify/api-codegen-preset` + `graphql-codegen` (`pnpm --filter template codegen`, config in `.graphqlrc.ts`). Every query/mutation is tagged `#graphql ... as const`; codegen pulls the live Storefront schema for `SHOPIFY_API_VERSION` and **fails on any unknown field/argument/type**, automating AGENTS.md rule #4. Generated types are committed to `lib/shopify/types/generated/` so builds need no schema network access.
- **Error contract**: a new `assertStorefrontOk(response, operation)` in `lib/shopify/errors.ts` reproduces the old `shopifyFetch` semantics (throw on no-data/GraphQL failure, warn on partial errors) and narrows `response.data` to non-null.
- `shopifyFetch` was removed from `lib/shopify/fetch.ts`; `customerAccountFetch` (the separate Customer Account API endpoint/schema) is **unchanged** and still hand-rolled.

Call sites keep their existing hand-written response type, now passed as the explicit `storefront.request<ResponseType>(QUERY, { variables })` generic. Transforms in `lib/shopify/transforms/*` and all `"use cache"`/`cacheTag` wrappers are unchanged — caching behavior is identical.

While converting, codegen surfaced a **pre-existing bug**: `getCartSelectableAddressId` queried `cart.selectableAddresses`, which does not exist on the Storefront `Cart` type (the live API errors on it). It now queries `cart.delivery.addresses`. The function has no callers (reference-library export), so the fix is behavior-neutral for shipped code.

## Why it matters

- Queries are now validated against the live schema at codegen time instead of relying on developer discipline — typos and schema drift become a failed command, not a runtime error.
- The runtime client is first-party and maintained by Shopify, with retries and streaming available if needed later.
- The migration is additive to the existing architecture (operations remain the cache boundary; transforms remain the domain boundary), so it composes with i18n, CMS, and other extensions unchanged.

## Apply when

- The storefront wants schema-validated Storefront queries and is willing to run `pnpm codegen` when queries change (or wire it into CI).
- The storefront has diverged the `lib/shopify` layer only lightly and can take the data-layer swap wholesale.

## Safe to skip when

- The storefront has heavily customized `shopifyFetch` (custom headers, transport, telemetry) such that re-expressing it through `customFetchApi` is more work than it's worth.
- The storefront cannot run codegen against Shopify's direct-proxy schema (air-gapped CI without the committed types refreshed) and doesn't want the generated artifacts in its tree.

## Notes

- **Adopt the `getCartSelectableAddressId` fix independently** if you don't take the whole migration: `cart.selectableAddresses` → `cart.delivery.addresses` (element type `CartSelectableAddress`).
- Codegen only resolves interpolations of other `#graphql`-tagged consts by name. A raw selection snippet that isn't a valid standalone document (the old `WARNINGS_QUERY_FRAGMENT`) can't be `#graphql`-tagged, so it was inlined into each cart mutation.
- Generated files under `lib/shopify/types/generated/` are committed but excluded from oxlint/oxfmt.
- `@shopify/api-codegen-preset` bundles `@graphql-codegen/cli`, but pnpm doesn't hoist its bin; `@graphql-codegen/cli` is added as a direct dependency so the `codegen` script resolves.

## Validation

1. `pnpm --filter template codegen` — succeeds; temporarily typo a field and confirm it fails with "Cannot query field …", then revert.
2. `pnpm --filter template lint` — oxlint + oxfmt clean (generated dir ignored).
3. `pnpm --filter template build` — succeeds under `cacheComponents`; PDP, collection, search, and sitemap routes prerender.
4. `pnpm --filter template dev` — exercise PDP, PLP/collection, search + predictive search, nav menu, and cart add/update/remove (confirm the cart still updates, i.e. `invalidateCartCache` path intact).
