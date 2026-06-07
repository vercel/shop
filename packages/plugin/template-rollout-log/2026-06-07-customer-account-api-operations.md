---
title: Customer Account API operations — live orders, order detail, address CRUD, profile editing
changeKey: customer-account-api-operations
introducedOn: 2026-06-07
changeType: feat
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/account/(authenticated)/addresses/page.tsx
  - apps/template/app/account/(authenticated)/orders/[id]/page.tsx
  - apps/template/app/account/(authenticated)/orders/page.tsx
  - apps/template/app/account/(authenticated)/profile/page.tsx
  - apps/template/components/account/address-book.tsx
  - apps/template/components/account/order-display.tsx
  - apps/template/components/account/profile-form.tsx
  - apps/template/lib/customer/action.ts
  - apps/template/lib/shopify/fetch.ts
  - apps/template/lib/shopify/operations/customer.ts
  - apps/template/lib/shopify/transforms/customer.ts
  - apps/template/lib/types.ts
  - apps/template/lib/i18n/messages/en.json
  - apps/docs/content/docs/anatomy/authentication.mdx
---

## Summary

The account pages were scaffolds — `/account/orders`, `/account/orders/[id]`, and `/account/addresses` rendered empty-state placeholders, and `/account/profile` showed read-only session data. This change wires them to the Shopify Customer Account API so they match what Hydrogen ships:

- **Orders** — cursor-paginated history (newest first), each row linking to detail.
- **Order detail** — line items with thumbnails, order/financial status, totals (subtotal, shipping, tax, total), shipping address, and a link to Shopify's hosted status page.
- **Addresses** — full CRUD with create, edit, delete, and default-address selection.
- **Profile** — editable first/last name (email shown read-only) via `customerUpdate`.

The data layer is new and mirrors the existing Storefront layer:

- `lib/shopify/fetch.ts` gains `customerAccountFetch()`, which POSTs to `https://{domain}/customer/api/{version}/graphql` with the customer's OAuth access token as the raw `Authorization` header (no `Bearer` prefix) — a separate endpoint and schema from the Storefront API.
- `lib/shopify/operations/customer.ts` holds the queries and mutations; each resolves the access token through `requireSession()`.
- `lib/shopify/transforms/customer.ts` maps responses to provider-agnostic types in `lib/types.ts`.
- `lib/customer/action.ts` provides `"use server"` actions for the address and profile forms (validation, `userErrors` surfacing, `revalidatePath`).

All GraphQL was validated against the live `2026-04` Customer Account API schema.

## Why it matters

- Closes the largest gap from the Hydrogen comparison: the account area is now functional, not stubbed.
- Establishes the Customer Account API fetch/operation/transform/action pattern downstream storefronts can extend (store credit, subscriptions, draft orders) without re-deriving the endpoint and auth-header quirks.
- Keeps token handling server-only and per-request — order data is never shared across customers.

## Apply when

- The storefront uses the built-in better-auth + Shopify OIDC auth (`NEXT_PUBLIC_ENABLE_AUTH="1"`) largely as shipped.
- The account pages are still the template's scaffolds (no custom order/address UI already wired).

## Safe to skip when

- The storefront has replaced the account area with its own implementation or a different identity provider.
- The storefront intentionally keeps a guest-only experience with auth disabled.

## Notes

- Country (`territoryCode`) and region (`zoneCode`) are collected as ISO-code text inputs. A country/region dropdown is a reasonable enhancement layered on top — `CustomerAddressInput` is unchanged.
- Status enums (`fulfillmentStatus`, `financialStatus`) are humanized at the display layer, not stored in locale catalogs.
- The nav/sidebar name still comes from the better-auth session (ID token), so a profile name edit isn't reflected there until the next sign-in; the profile page itself shows the updated value immediately.

## Validation

1. `pnpm --filter template build` with auth configured — account pages compile and render.
2. Sign in, visit `/account/orders` — orders list newest-first; "Older"/"Newer" paginate.
3. Open an order — line items, totals, shipping address, and "View order status" link render.
4. `/account/addresses` — add, edit, delete an address; toggle default; confirm changes persist after reload.
5. `/account/profile` — edit first/last name, save, confirm the value persists after reload.
