---
title: PDP specifications — opt-in product metafields rendered from config
changeKey: pdp-metafields-specs
introducedOn: 2026-06-20
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/config.ts
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/shopify/transforms/product.ts
  - apps/template/components/product-detail/product-specs.tsx
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/lib/i18n/messages/en.json
  - apps/docs/content/docs/shopify/pdp.mdx
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
---

## Summary

The PDP can now render product metafields as a "Specifications" label/value list below the description — opt-in, with no hardcoded namespaces.

- `lib/config.ts` gains `productMetafieldIdentifiers: Array<{ key: string; namespace: string }>`, **empty by default**.
- `getProductByHandle` (`lib/shopify/operations/products.ts`) appends a `metafields(identifiers: [...])` selection built from that list — and includes `${METAFIELD_FRAGMENT}` — only when it is non-empty. An empty list leaves the query byte-for-byte unchanged (zero query weight).
- `transformMetafields` now formats values by `type`: text/number pass through, measurements (`dimension`/`weight`/`volume`) and `rating` are parsed from their JSON, `boolean` → Yes/No, `list.*` joined. Reference types (`*_reference`) are skipped — their value is a GID that needs a follow-up query to resolve. The domain `Metafield` shape (`{ key, label, value }`) is unchanged, so the agent markdown builder benefits from the cleaner values too.
- New `ProductSpecs` component (`components/product-detail/product-specs.tsx`) renders the list (returns nothing when empty) and is mounted in `product-detail-section.tsx` below the description. It renders eagerly from the cached product in the static shell, like bundle relationships.
- New `product.specifications` message ("Specifications") in `en.json`.

## Why it matters

Metafields are the storage layer most first-party and third-party apps write into (size charts, ingredients, warranty/specs, reviews-app data). This adds the PDP UI consumer that was missing — `ProductDetails.metafields` previously surfaced only in the agent markdown — while honoring the prior decision to ship no default identifiers: wiring is now a config edit plus optional label entries, not a manual fragment edit.

## Apply when

- Your store populates product metafields you want shown on the PDP.

## Safe to skip when

- You don't use product metafields (the default empty config leaves the PDP and the product query unchanged).
- A custom PDP already renders its own spec/detail section.

## Adoption notes

- Supersedes the adoption guidance in `2026-04-29-drop-default-metafield-identifiers.md`: instead of hand-editing `PRODUCT_FRAGMENT`, list identifiers in `productMetafieldIdentifiers` (`lib/config.ts`). The query injection and the renderer are now shipped.
- Add friendly labels to `METAFIELD_LABELS` in `lib/shopify/transforms/product.ts`; keys without an entry fall back to a humanized key.
- Reference / metaobject metafields are not yet resolved (skipped). Resolving them is a follow-up (add `reference`/`references` to `METAFIELD_FRAGMENT` + resolution logic).

## Validation

1. Set `productMetafieldIdentifiers` to a couple of keys your store populates, open a PDP, and confirm the "Specifications" list renders with friendly labels and type-formatted values.
2. Confirm an empty config renders nothing and leaves the product query unchanged.
3. Run `pnpm --filter template lint`, `pnpm --filter template build`, and `pnpm --filter docs build`.
