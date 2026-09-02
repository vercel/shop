# Vercel Shop GraphQL Integration Reference

## Ownership boundary

| Concern | Owner |
| --- | --- |
| Shopify fields, types, arguments, enums, API versions, examples, and operation validation | Shopify AI Toolkit |
| Operation file, shared fragments, locale helpers, response types, domain transforms, cache role, tags, and route composition | Vercel Shop |

Never duplicate Shopify API reference material here. Re-run Shopify validation whenever the final document changes.

## Key Vercel Shop files

| Resource | Role |
| --- | --- |
| `lib/shopify/storefront.ts` | Shared `@shopify/hydrogen` storefront client wrapper, typed `storefront.request`, and `ResultOf<Doc>` |
| `lib/shopify/errors.ts` | `assertStorefrontOk()` response contract |
| `.graphqlrc.ts` + `pnpm codegen` | Validates Storefront `#graphql` documents against the live schema |
| `lib/shopify/customer-account.ts` | Separate Customer Account API transport and `CustomerAccountResultOf<Doc>` |
| `lib/shopify/customer-account-fragments.ts` | Shared Customer Account selections |
| `lib/shopify/fragments.ts` | Shared Storefront selections |
| `lib/shopify/operations/*.ts` | Domain-oriented query and mutation entry points |
| `lib/shopify/transforms/*.ts` | Shopify response to domain mapping; input types derive from fragment documents |
| `lib/shopify/types/**` | App-owned filter input shape and generated validation output |
| `lib/types.ts` | Provider-independent types consumed by presentation |
| `lib/cart/server.ts` | Cart cookie helpers and server-side cart read seeding |
| `app/api/webhooks/shopify/route.ts` | Public-content invalidation entry point |

## Data flow

```text
Route → domain operation → storefront.request → validated Shopify operation
      ← domain type      ← transform         ← Shopify response
```

Do not add an internal HTTP hop between a Server Component and `lib/shopify/operations/`. Do not return raw Shopify response types to presentation.

## Documents and codegen

- Wrap every Storefront query, mutation, and fragment in `gql()` from `@shopify/hydrogen`; Customer Account documents use `gql()` from `@shopify/hydrogen/customer-account`. Keep the leading `#graphql` comment so codegen plucks the document.
- Compose fragments by passing them as the second `gql(source, [FRAGMENT_A, FRAGMENT_B])` argument. Never interpolate a fragment string into another document.
- Do not add a separate `MoneyFields` or `ImageFields` fragment. Inline `amount currencyCode` and `url altText width height`; two fragments that both embed the same leaf fragment would emit it twice in one document.
- Keep documents static. Pass dynamic values as GraphQL variables or choose between separate static documents at the call site.
- Call `storefront.request(QUERY, { locale, variables })`, then `assertStorefrontOk(response, operationName)`. Result and variable types come from the document; do not write a response type. Omit `country` and `language` from `variables` — the wrapper injects them from `locale`.
- Derive raw Shopify types for transforms with `ResultOf<typeof FRAGMENT>` (Storefront) or `CustomerAccountResultOf<typeof FRAGMENT>` (Customer Account) instead of hand-writing interfaces.
- Select `__typename` on union or interface fields (`node`, `nodes`, `search` results) and narrow with `node.__typename === "Product"`.
- Run `pnpm --filter template codegen` after changing a Storefront document. Generated validation output is gitignored and regenerated during development and builds.

Shopify AI Toolkit validates Shopify correctness; type inference gives editor feedback; local codegen ensures the integrated Storefront document still matches the configured live schema (inference resolves unknown fields to `unknown` rather than failing).

## Choose cache behavior from the consumer

| Render role | Treatment |
| --- | --- |
| Public identity/body that must be included coherently in a prerendered shell | Plain `"use cache"` with the established lifetime and tags |
| Public, reusable results resolved after request inputs such as filters, search, cursor, or runtime composition | `"use cache: remote"` when shared Runtime Cache is justified |
| Cart, session, authorization, or Customer Account data | Uncached or private/request-scoped; never public remote cache |
| Mutation | No read-cache directive; invalidate the affected domain after success |

Follow the closest existing operation with the same render role. Do not choose a directive solely because the upstream data is public. Cache placement changes whether content becomes part of the static shell and can affect hydration coherence.

Current examples of intent:

- Product and collection identity/body reads use plain `"use cache"` when their stable content belongs in the PDP or PLP shell.
- Filtered collection, search, facet, and cursor reads use `"use cache: remote"` when request inputs resolve outside those shells and results are reusable.
- Customer Account operations and cart reads remain customer/request scoped.

## Operation integration

- Preserve stable GraphQL operation names and pass the same name to error and logging helpers.
- Reuse `PRODUCT_CARD_FRAGMENT` for listing payloads and `PRODUCT_FRAGMENT` for the stable PDP body only when their current selections fit the task.
- Use `@inContext` and the existing locale helpers for locale-sensitive Storefront operations.
- Add response fields to the fragment or operation document, the transform, and the domain type as one coherent change; the raw type follows the document automatically.
- Preserve missing-resource contracts: use the existing `undefined`, `null`, or empty-collection convention for the domain.

## Invalidation

- Reuse established product, collection, menu, recommendation, sitemap, CMS, and cart tags.
- Add a new tag only when the webhook or mutation path can invalidate it correctly.
- Keep public-content tags aligned with `app/api/webhooks/shopify/route.ts`.
- Never place carts in the Next.js data cache; cart reads are memoized per request via `getCart`, so cart mutations need no cache invalidation step.
- Never rely on public cache invalidation for Customer Account privacy or authorization.

## Completion checklist

- Shopify AI Toolkit validated the final document against the intended API version.
- Local codegen passes for the integrated static document.
- The operation lives in the closest domain file and uses existing transport.
- Cache behavior follows render role, not a blanket default.
- Locale variables flow through existing helpers when applicable.
- Raw and domain types remain separated by a transform.
- Mutations invalidate the affected state.
- Direct visits, client navigation, failure states, and affected commerce flows pass.
