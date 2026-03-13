---
name: fetch-shopify-schema
description: Fetch local Shopify Storefront and Customer Account GraphQL schema snapshots for the shop app.
---

# Fetch Shopify GraphQL Schema

## Description
Fetches the latest Shopify GraphQL schemas (Storefront API and Customer Account API) for reference when working with Shopify operations.

## When to Use This Skill
- Before writing new Shopify GraphQL queries or mutations
- When you need to check available fields on a type
- When debugging GraphQL errors related to field names or types
- When exploring what data is available from Shopify's APIs
- When the user asks about Shopify GraphQL schema or types

## How to Use

### 1. Fetch the Storefront API schema

```bash
bun run .claude/scripts/fetch-shopify-schemas.ts
```

This automatically fetches the Storefront API schema using the configured `SHOPIFY_STOREFRONT_ACCESS_TOKEN`.

### 2. Fetch the Customer Account API schema

The Customer Account API requires a user's access token (obtained via OAuth login). To fetch it:

**Option A: Use the debug endpoint (recommended)**

1. Start the dev server: `bun dev`
2. Log in to the app at http://localhost:3000/login
3. Visit http://localhost:3000/api/auth/debug-token
4. Copy the command from the response and run it:

```bash
SHOPIFY_CUSTOMER_ACCESS_TOKEN="<token>" bun run .claude/scripts/fetch-shopify-schemas.ts
```

**Option B: Set the token in environment**

Add to `.env.local`:
```
SHOPIFY_CUSTOMER_ACCESS_TOKEN=<your-token>
```

Then run the script normally.

### 3. Reference the schemas

After fetching, read the schema files:

- **Storefront API**: `.claude/schemas/shopify-storefront.graphql`
- **Customer Account API**: `.claude/schemas/shopify-customer.graphql`

The schemas are in SDL (Schema Definition Language) format.

## Schema Locations

| API | Schema File | Auth Required |
|-----|-------------|---------------|
| Storefront API | `.claude/schemas/shopify-storefront.graphql` | `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (public) |
| Customer Account API | `.claude/schemas/shopify-customer.graphql` | User access token via OAuth |

## Notes

### Storefront API
- Uses the public Storefront Access Token (already in `.env`)
- Provides read access to products, collections, cart operations
- Most common API for storefront implementations

### Customer Account API
- Requires a logged-in user's OAuth access token
- Provides access to customer data, orders, addresses
- Token expires after a period (use refresh flow for long-term access)
- Debug endpoint at `/api/auth/debug-token` helps extract tokens (dev only)

## Environment Variables

```
# Required for Storefront API
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token

# Required for Customer Account API schema
SHOPIFY_CUSTOMER_ACCESS_TOKEN=<user-token>  # From OAuth login
```

## Example Workflow

1. User asks: "What fields are available on the Customer type?"
2. Ensure you're logged in and get token via `/api/auth/debug-token`
3. Run: `SHOPIFY_CUSTOMER_ACCESS_TOKEN="..." bun run .claude/scripts/fetch-shopify-schemas.ts`
4. Read: `.claude/schemas/shopify-customer.graphql`
5. Search for `type Customer` in the schema
6. List available fields for the user
