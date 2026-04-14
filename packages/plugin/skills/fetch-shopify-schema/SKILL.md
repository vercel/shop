---
name: fetch-shopify-schema
description: Use Shopify AI Toolkit to inspect live Storefront and Customer Account GraphQL schemas for Vercel Shop work.
---

# Fetch Shopify GraphQL Schema

## Description

Use this skill when you need authoritative Shopify GraphQL schema details while working on Vercel Shop. The schema source of truth is the installed `Shopify/shopify-ai-toolkit` plugin, not committed snapshot files in the repo.

## When to Use This Skill

- Before writing new Shopify GraphQL queries or mutations
- When you need to check available fields on a type
- When debugging GraphQL errors related to field names or types
- When exploring what data is available from Shopify's APIs
- When the user asks about Shopify GraphQL schema or types

## How to Use

### 1. Use `shopify-ai-toolkit` as the schema source of truth

- Use the installed `Shopify/shopify-ai-toolkit` plugin to inspect the live schema for the relevant API.
- Prefer live type lookup, field lookup, argument validation, and API exploration there over local `.graphql` snapshots.
- Do not create or update repo-local schema snapshot files for this template.

### 2. Pick the right Shopify API

- **Storefront API** for products, collections, menus, carts, search, and storefront-facing metaobjects
- **Customer Account API** for customer profile, orders, addresses, and authenticated account data

Never treat the Storefront API and Customer Account API schemas as interchangeable.

### 3. Hand off to the template workflow

- After confirming the schema details, use `/vercel-shop:shopify-graphql-reference` for the template's GraphQL patterns: file placement, fragments, locale context, caching, and transforms.
- If the task is specifically about authentication or metaobjects, use the matching Vercel Shop skill after the schema check.

### 4. If the toolkit is unavailable

- Ask the user to install or re-install the project-scoped Shopify plugin:

```bash
npx plugins add Shopify/shopify-ai-toolkit --scope project --yes
```

- If live toolkit access is blocked, fall back to official Shopify API docs or schema explorers instead of adding committed snapshot files to the repo.

## Notes

### Storefront API

- Uses the public Storefront Access Token
- Provides read access to products, collections, cart operations
- Most common API for storefront implementations

### Customer Account API

- Requires customer authentication and a customer-scoped access token
- Provides access to customer data, orders, addresses
- Token handling stays inside the auth flow and server-side helpers

## Guardrails

- Never guess Shopify field names, enum values, or argument shapes.
- Never add `.claude/schemas`, checked-in schema snapshots, or other agent-only schema caches to the template.
- Use `/vercel-shop:shopify-graphql-reference` for template conventions after the live schema check.

## Example Workflow

1. User asks: "What fields are available on the Customer type?"
2. Use `shopify-ai-toolkit` to inspect the live Customer Account schema
3. Search for the `Customer` type and confirm the fields and nested objects
4. Use `/vercel-shop:shopify-graphql-reference` if you need to place a new operation in the template
5. Answer the user with the validated fields
