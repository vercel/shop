# Vercel Shop GraphQL Integration Reference

## Ownership boundary

| Concern                                                                                                                      | Owner              |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Shopify fields, types, arguments, enums, API versions, examples, and operation validation                                    | Shopify AI Toolkit |
| Operation file, shared fragments, locale helpers, response types, domain transforms, cache role, tags, and route composition | Vercel Shop        |

Never duplicate Shopify API reference material here. Re-run Shopify validation whenever the final document changes.

## Data flow

```text
Route → lib/<domain>/server.ts get* (cache) → lib/shopify/operations fetch* → storefront.request → validated Shopify operation
      ← domain type                          ← transform                       ← Shopify response
```

Do not add an internal HTTP hop between a Server Component and `lib/shopify/operations/`. Catalog and account presentation use transformed domain types. Cart state is intentionally different: derive its types from Hydrogen handlers through `lib/cart/types.ts`, rather than maintaining a second cart model. Product selection adapts catalog models to Hydrogen's `ProductInput`; generic `ui/` primitives still accept primitive presentation props.

## Documents

- Wrap every Storefront query, mutation, and fragment in `gql()` from `@shopify/hydrogen`; Customer Account documents use `gql()` from `@shopify/hydrogen/customer-account`. Keep the leading `#graphql` comment so editors and tooling recognize the document.
- Compose fragments by passing them as the second `gql(source, [FRAGMENT_A, FRAGMENT_B])` argument. Never interpolate a fragment string into another document.
- Do not add a separate `MoneyFields` or `ImageFields` fragment. Inline `amount currencyCode` and `url altText width height`; two fragments that both embed the same leaf fragment would emit it twice in one document.
- Keep documents static. Pass dynamic values as GraphQL variables or choose between separate static documents at the call site.
- Call `storefront.request(QUERY, { variables })` for deployment defaults, or pass `locale: { country, language }` for explicit commerce context, then `assertStorefrontOk(response, operationName)`. `locale` is a `CommerceLocale` object from `lib/config/types.ts`, not the formatting locale string. Result and variable types come from the document; do not write a response type. Declare `$country: CountryCode` and `$language: LanguageCode` and omit them from `variables` — the wrapper injects them from that context. A same-named variable of another type, such as a `String!` metafield key, is yours to pass.
- Derive raw Shopify types for transforms with `ResultOf<typeof FRAGMENT>` (Storefront) or `CustomerAccountResultOf<typeof FRAGMENT>` (Customer Account), imported from `lib/shopify/types.ts`, instead of hand-writing interfaces. Keep named resource contracts in the owning domain's `types.ts`; do not import shared types from a transport or operation's `server.ts`.
- Select `__typename` on union or interface fields (`node`, `nodes`, `search` results) and narrow with `node.__typename === "Product"`.
Shopify AI Toolkit validates documents; there is no local schema gate, and typecheck does not catch invalid fields. Exercise a new or changed operation against the store once.

## Choose cache behavior from the consumer

The cache-role table in `build-shop`'s `references/rendering-architecture.md` is canonical: it covers catalog and content reads, default collection first pages, filtered or sorted browse, request-scoped customer data, and mutations. Follow the closest existing operation with the same render role. Do not choose a directive solely because the upstream data is public; cache placement decides whether content joins the static shell and can affect hydration coherence.

## Deployment context versus copy locale

Inspect the transport and operation signatures before changing them: existing `locale` arguments and cache inputs can remain intentional, and an already localized or Markets-enabled store keeps its validated request context instead of deployment defaults. Country and language scope Shopify commerce data; the formatting locale and translated UI copy are not an implicit market selection, and currency always comes from Shopify responses. Do not reintroduce UI locale plumbing only to call an operation.

## Operation integration

- Preserve stable GraphQL operation names and pass the same name to error and logging helpers.
- Reuse `PRODUCT_CARD_FRAGMENT` for listing payloads and `PRODUCT_FRAGMENT` for the stable PDP body only when their current selections fit the task.
- Use `@inContext` and the existing commerce-context boundary for locale-sensitive Storefront operations; do not assume legacy `lib/i18n/` helpers exist.
- Add response fields to the fragment or operation document, the transform, and the domain type as one coherent change; the raw type follows the document automatically.
- Preserve missing-resource contracts: use the existing `undefined`, `null`, or empty-collection convention for the domain.

## Invalidation

- Reuse established product, collection, menu, recommendation, sitemap, and CMS tags; carts have no public cache tags.
- Add a new tag only when the webhook or mutation path can invalidate it correctly.
- Keep public-content tags aligned with `app/api/webhooks/shopify/route.ts` and the `/api/revalidate` tags listed in the Webhooks docs; callers pass those names.
- Never rely on public cache invalidation for Customer Account privacy or authorization.

## Completion checklist

- Shopify AI Toolkit validated the final document against the intended API version.
- The integrated document has been exercised against the store or validated with the toolkit after its final edit.
- The operation lives in the closest domain file and uses existing transport.
- Cache behavior follows render role, not a blanket default.
- Locale variables flow through existing helpers when applicable.
- Catalog/account raw types and presentation types remain separated by a transform; cart types remain handler-derived.
- Public-content mutations invalidate affected tags; cart mutations reconcile through Hydrogen without public cache invalidation.
- Direct visits, client navigation, failure states, and affected commerce flows pass.
