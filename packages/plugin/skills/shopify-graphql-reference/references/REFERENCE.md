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
| `lib/shopify/fetch.ts` | Storefront and Customer Account transport and error handling |
| `lib/shopify/fragments.ts` | Shared Storefront selections |
| `lib/shopify/operations/*.ts` | Domain-oriented query and mutation entry points |
| `lib/shopify/transforms/*.ts` | Shopify response to domain mapping |
| `lib/shopify/types/**` | Raw Shopify response shapes |
| `lib/types.ts` | Provider-independent types consumed by presentation |
| `lib/cart/server.ts` | Cart cookie helpers and `invalidateCartCache()` |
| `app/api/webhooks/shopify/route.ts` | Public-content invalidation entry point |

## Data flow

```text
Route → domain operation → shopifyFetch → validated Shopify operation
      ← domain type      ← transform    ← Shopify response
```

Do not add an internal HTTP hop between a Server Component and `lib/shopify/operations/`. Do not return raw Shopify response types to presentation.

## Choose cache behavior from the consumer

| Render role | Treatment |
| --- | --- |
| Public identity/body that must be included coherently in a prerendered shell | Plain `"use cache"` with the established lifetime and tags |
| Public, reusable results resolved after request inputs such as filters, search, cursor, or runtime composition | `"use cache: remote"` when shared Runtime Cache is justified |
| Cart, session, authorization, or Customer Account data | Uncached or private/request-scoped; never public remote cache |
| Mutation | No read-cache directive; invalidate the affected domain after success |

Follow the closest existing operation with the same render role. Do not choose a directive solely because the upstream data is public. Cache placement changes whether content becomes part of the static shell and can affect hydration coherence.

Current examples of intent:

- `getProduct()` and `getCollection()` use plain `"use cache"` because their stable bodies belong in the PDP and PLP shells.
- Filtered collection/search/facet reads use `"use cache: remote"` because request inputs resolve outside those shells and results are reusable.
- Customer Account operations and cart reads remain customer/request scoped.

## Operation integration

- Keep GraphQL operation names stable and pass the same name to `shopifyFetch`.
- Pass dynamic values as variables, never string interpolation.
- Reuse `PRODUCT_CARD_FRAGMENT` for listing payloads and `PRODUCT_FRAGMENT` for the stable PDP body only when their current selections fit the task.
- Use `@inContext` and the existing locale helpers for locale-sensitive Storefront operations.
- Add response fields to raw Shopify types, transforms, and domain types as one coherent change.
- Preserve missing-resource contracts: use the existing `undefined`, `null`, or empty-collection convention for the domain.

## Invalidation

- Reuse established product, collection, menu, recommendation, sitemap, CMS, and cart tags.
- Add a new tag only when the webhook or mutation path can invalidate it correctly.
- Keep public-content tags aligned with `app/api/webhooks/shopify/route.ts`.
- Call `invalidateCartCache()` after every successful cart mutation.
- Never rely on public cache invalidation for Customer Account privacy or authorization.

## Completion checklist

- Shopify AI Toolkit validated the final document against the intended API version.
- The operation lives in the closest domain file and uses existing transport.
- Cache behavior follows render role, not a blanket default.
- Locale variables flow through existing helpers when applicable.
- Raw and domain types remain separated by a transform.
- Mutations invalidate the affected state.
- Direct visits, client navigation, failure states, and affected commerce flows pass.
