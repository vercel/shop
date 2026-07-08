---
title: Agent — native Storefront MCP tools (catalog search, product details, policy Q&A) as an alternative to the GraphQL discovery tools
changeKey: native-storefront-mcp-search
introducedOn: 2026-07-07
changeType: feature
defaultAction: review
appliesTo:
  - apps/template/agent/tools/search_catalog.ts
  - apps/template/agent/tools/get_catalog_product.ts
  - apps/template/agent/tools/search_shop_policies_and_faqs.ts
  - apps/template/lib/shopify/storefront.ts
  - apps/template/lib/shopify/fetch.ts
paths:
  - apps/template/agent/tools/search_catalog.ts
  - apps/template/agent/tools/get_catalog_product.ts
  - apps/template/agent/tools/search_shop_policies_and_faqs.ts
  - apps/template/lib/shopify/storefront.ts
  - apps/template/lib/shopify/fetch.ts
  - apps/template/turbo.json
  - apps/template/.env.example
relatedSkills:
  - /vercel-shop:build-shop
---

## Summary

Adds three agent tools backed by Shopify's hosted **Storefront MCP** server (`/api/mcp`) as an alternative to the template's GraphQL-backed discovery tools, so the two can be compared on relevance. They ship alongside the existing tools, not as replacements.

- **`lib/shopify/storefront.ts`** gains a small JSON-RPC 2.0 client (`callStorefrontMcp`) plus `searchCatalog`, `getCatalogProduct`, and `searchShopPoliciesAndFaqs`. These sit next to the GraphQL `storefront` client (same public token, no `server-only` guard) so the eve runtime can import them. The client prefers the `structuredContent` envelope and falls back to the JSON text block, and sends `meta.ucp-agent.profile` only when `UCP_AGENT_PROFILE_URL` is set.
- **`agent/tools/search_catalog.ts`** — native semantic search with a natural-language `intent`; results are enriched with the storefront handle via the new `fetchProductHandlesByIds` (Storefront `nodes` query) so MCP results feed `navigate_user` / `get_product_details` / `add_to_cart` instead of living in a GID-only silo.
- **`agent/tools/get_catalog_product.ts`** — product details by product GID, returning price, availability, options, variant ID, and the resolved handle.
- **`agent/tools/search_shop_policies_and_faqs.ts`** — net-new capability answering store policy, shipping, returns, and FAQ questions (no site equivalent).
- Registers the optional `UCP_AGENT_PROFILE_URL` in `turbo.json` globalEnv and `.env.example`.

Note: Shopify's MCP tools are inconsistent in money encoding — `search_catalog` returns minor-unit objects while `get_product_details` returns major-unit strings with a sibling `currency`; the types and transforms handle both.

## Why it matters

Storefronts that run the agent get Shopify's merchant-tuned semantic search and a policy/FAQ answerer without hand-rolling either, plus a GID→handle bridge that keeps native discovery compatible with the storefront's own routes and cart.

## Apply when

- The storefront runs the eve agent and wants to trial native Shopify search/policy tools against the GraphQL ones.

## Adopt with changes

- The store's Storefront MCP endpoint (`/api/mcp`) must be enabled; set `UCP_AGENT_PROFILE_URL` if the store requires an agent profile.
- Storefronts that customized `agent/instructions.md` may want to steer the model between `search_products` (GraphQL) and `search_catalog` (MCP), since both are now available.

## Safe to skip when

- The storefront doesn't run the agent, or has no interest in the MCP data path.

## Validation

1. With the agent enabled, ask it to find a product; confirm `search_catalog` returns results carrying both a `productId` (GID) and a storefront `handle`.
2. Ask a returns/shipping question; confirm `search_shop_policies_and_faqs` answers from the store's policies.
3. `pnpm --filter template exec tsc --noEmit` passes.
