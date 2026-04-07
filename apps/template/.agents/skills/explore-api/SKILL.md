---
name: explore-api
description: Explore your commerce provider's API — fetch schemas, make test calls, and save reference documentation for use when writing operations.
---

# Explore Commerce Provider API

## Description

Explores and documents the commerce provider's API for reference when writing operations and transforms. Works with any API protocol (REST, GraphQL, or hybrid).

## When to Use This Skill

- Before writing new operations for the commerce provider
- When you need to check available fields, endpoints, or types
- When debugging API errors related to field names or request format
- When exploring what data is available from the provider's APIs
- When the user asks about the provider's API capabilities

## How to Use

### 1. Identify the API type

Ask the user or check existing provider code to determine:
- **GraphQL** — single endpoint, schema-driven, introspection available
- **REST** — multiple endpoints, may have OpenAPI/Swagger spec
- **Hybrid** — some operations are REST, some are GraphQL

### 2. Fetch API reference

#### For GraphQL providers

Use introspection to fetch the schema:

```bash
curl -s -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -d '{"query":"{ __schema { types { name kind fields { name type { name kind ofType { name } } } } } }"}' \
  | jq . > .claude/schemas/storefront.graphql.json
```

Or write a small script using the `graphql` package to convert introspection to SDL:

```bash
bun run .claude/scripts/fetch-schemas.ts
```

#### For REST providers

Fetch the OpenAPI specification if available:

```bash
curl -s "${API_URL}/openapi.json" | jq . > .claude/schemas/openapi.json
```

If no spec is available, make exploratory calls and save example responses:

```bash
# Products
curl -s "${API_URL}/products?limit=1" -H "Authorization: Bearer ${API_KEY}" | jq . > .claude/schemas/product-example.json

# Collections/categories
curl -s "${API_URL}/collections" -H "Authorization: Bearer ${API_KEY}" | jq . > .claude/schemas/collections-example.json

# Cart
curl -s -X POST "${API_URL}/carts" -H "Authorization: Bearer ${API_KEY}" -H "Content-Type: application/json" | jq . > .claude/schemas/cart-example.json
```

#### For any provider

Read the provider's official API documentation:

```bash
# Use WebSearch/WebFetch to find and read API docs
```

### 3. Save to `.claude/schemas/`

Save API reference files in `.claude/schemas/`. Common formats:

| Provider type | Reference format | Example filename |
|--------------|-----------------|-----------------|
| GraphQL | SDL schema | `storefront.graphql` |
| GraphQL | Introspection JSON | `storefront.graphql.json` |
| REST | OpenAPI spec | `openapi.json` |
| REST | Example responses | `product-example.json` |
| Any | API notes | `api-notes.md` |

### 4. Reference the schemas

After fetching, read the reference files in `.claude/schemas/` when writing operations. These are the source of truth for field names, types, and request formats.

## Key Things to Document

When exploring an API, pay attention to and save notes about:

- **Authentication** — how to authenticate (API key, OAuth, bearer token)
- **Product structure** — how variants, options, pricing, and images are represented
- **ID formats** — UUIDs, numeric IDs, encoded strings — components pass these opaquely
- **Price format** — cents (integer) vs decimal (string), currency handling
- **Pagination** — cursor-based, offset-based, or page-based
- **Locale handling** — query param, header, separate endpoint, or field-level localization
- **Image URLs** — CDN hostname (needed for `next.config.ts` image patterns)
- **Rate limits** — any throttling to be aware of

## Schema Locations

| Reference | Location |
|-----------|----------|
| API schema/spec | `.claude/schemas/` |
| Example responses | `.claude/schemas/` |
| API notes | `.claude/schemas/api-notes.md` |

## Environment Variables

```
# Provider credentials (varies by provider)
COMMERCE_STORE_DOMAIN=your-store.example.com
COMMERCE_API_TOKEN=your_token
```

## Example Workflow

1. User asks: "What fields are available on the product type?"
2. Check if schema/reference exists in `.claude/schemas/`
3. If not, run the appropriate fetch command above
4. Read the reference file
5. Search for the product type/endpoint
6. List available fields for the user
