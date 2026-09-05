---
name: shopify-graphql-reference
description: Integrate Shopify-validated Storefront or Customer Account GraphQL into Vercel Shop. Use after Shopify AI Toolkit has supplied and validated an API operation, or when adapting existing GraphQL to the template's operation placement, fragments, domain transforms, locale flow, cache role, invalidation, and route architecture.
---

# Integrate Shopify GraphQL

Treat Shopify AI Toolkit as authoritative for Shopify documentation, schemas, fields, arguments, enum values, API versions, operation design, and validation. This skill owns only the Vercel Shop integration layer.

Read `references/REFERENCE.md` before editing.

## Delegate Shopify facts first

1. Choose the Shopify API:
   - Use Shopify AI Toolkit's Storefront GraphQL skill for catalog, search, menus, cart, and public metaobject reads.
   - Use its Customer skill for profiles, orders, addresses, and other authenticated customer data.
   - Use its custom-data skill first for metafields or metaobjects.
2. Search current Shopify documentation and validate the complete operation with that skill.
3. Do not copy schema snapshots, field catalogs, or generated API reference into this plugin.
4. If Shopify AI Toolkit is unavailable, use official Shopify documentation and validation tooling; do not guess.

## Apply the Vercel Shop conventions

1. Inspect the consuming route before choosing cache behavior. Classify the read as static-shell content, request-time shared content, or private/request-scoped data.
2. Add the operation to the closest file in `lib/shopify/operations/`; create a file only for a genuinely new domain.
3. Wrap documents in Hydrogen's `gql()` with a leading `#graphql` comment, keep them static, and use variables for dynamic values. Inference supplies types; codegen validates fields and arguments.
4. Reuse the smallest existing fragment that fits by passing it in the `gql(source, [FRAGMENT])` list. Extend a shared fragment only when multiple operations need the same selection.
5. Pass `locale` to `storefront.request` when Shopify localizes the result; never add `country` or `language` to `variables`.
6. Derive raw Shopify types from fragment documents with `ResultOf<typeof FRAGMENT>` under `lib/shopify/**`; transform catalog/account data into domain types before presentation. Cart types intentionally derive from Hydrogen handlers through `lib/cart/index.ts`.
7. Preserve cache tags and the existing webhook invalidation hierarchy. Do not cache mutations.
8. Never place carts in the Next.js data cache; cart reads are memoized per request via `getCart`, so cart mutations need no cache invalidation step.

## Revalidate both boundaries

1. Validate the final GraphQL document again with Shopify AI Toolkit after fragment and variable changes.
2. Run `npm run codegen` from the storefront root for Storefront operations, custom cart/search fragments, and Customer Account documents. Run local lint, typecheck, focused tests, and affected commerce flows; run a build when the changed surface requires it. Storefront validation uses the configured live schema; Customer Account validation uses Hydrogen's bundled schema.
3. Report separately:
   - Shopify validation performed;
   - Vercel Shop cache and route role;
   - domain transform and invalidation changes.

Do not present this skill as a Shopify schema source. Shopify AI Toolkit determines what Shopify supports; this skill determines how validated operations fit Vercel Shop.
