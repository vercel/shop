---
name: shopify-graphql-reference
description: Reference bundled Shopify GraphQL schemas, fragments, cache conventions, and transforms for any GraphQL work in the template.
---

# Shopify GraphQL Reference

## Description

Use this skill as the reference source for Shopify GraphQL work in the template. It keeps queries, mutations, schema lookups, fragment changes, locale handling, caching rules, and transforms aligned with the bundled reference schemas and established storefront patterns.

## When to Use This Skill

- When the user is doing any Shopify GraphQL work
- When the user wants a new query or mutation
- When an existing operation needs more fields
- When a GraphQL response shape must be mapped into domain types
- When debugging Shopify GraphQL errors, missing fields, or stale cache behavior
- When invoked via `/shopify-graphql-reference`

## Read These First

- Read [references/REFERENCE.md](references/REFERENCE.md) for the detailed technical reference: operation structure, fragment usage, locale context, cache rules, and common modifications.
- Read `references/schemas/shopify-storefront.graphql` before writing or changing fields.
- Read `references/schemas/shopify-customer.graphql` when customer account GraphQL is relevant.
- If the bundled references are missing or stale, run `scripts/fetch-references.sh`.

## Workflow

### 1. Verify the schema first

- Read `references/schemas/shopify-storefront.graphql` before writing or changing fields.
- Never guess Shopify field names, enum values, or argument shapes.
- If the bundled schema is stale or missing, run `scripts/fetch-references.sh`.

### 2. Choose the right operation file

- Add the operation to the closest existing file in `lib/shopify/operations/` when the concern already exists there.
- Create a new operation file only when the concern is genuinely new.
- Always call `shopifyFetch` with a stable `operation` name, a GraphQL document string, and `variables` passed as an object.

### 3. Reuse fragments deliberately

- Use `PRODUCT_FRAGMENT` for PDP-level product data.
- Use `PRODUCT_CARD_FRAGMENT` for listings, search results, and other lighter product cards.
- Extend `lib/shopify/fragments.ts` when several operations need the same fields.

### 4. Handle locale context correctly

- Locale-sensitive reads should use `@inContext(...)`.
- Use helpers from `lib/i18n` to derive country and language codes instead of hardcoding them.
- Keep locale flowing through the operation API so pages and components stay consistent.

### 5. Apply cache rules to reads

- Read operations should include `"use cache: remote"`, `cacheLife(...)`, and `cacheTag(...)`.
- Pick existing cache tags when the data belongs to an established surface.
- Mutations should not use read-cache directives.
- Every cart mutation must call `invalidateCartCache()` after the write succeeds.

### 6. Transform before returning

- Convert Shopify response shapes to domain types before they cross into components.
- Keep raw Shopify types inside `lib/shopify/**`.
- Update the matching transform and domain type when you add new fields.

### 7. Verify the change

- Re-read the query against `references/schemas/shopify-storefront.graphql`.
- Check that the operation name passed to `shopifyFetch` matches the GraphQL operation name.
- Run the smallest relevant validation command for the touched area.

## Guardrails

- Always reference `references/schemas/shopify-storefront.graphql` when writing GraphQL.
- Never interpolate dynamic values directly into the query string when GraphQL variables can carry them.
- Use `PRODUCT_CARD_FRAGMENT` for listings and `PRODUCT_FRAGMENT` for PDP work unless there is a clear reason not to.
- Return domain types from operations, not raw Shopify response types.
- Cart mutations must call `invalidateCartCache()`.

## Common changes

### Add a field to an existing product query

1. Confirm the field exists in `references/schemas/shopify-storefront.graphql`.
2. Add it to the appropriate fragment in `lib/shopify/fragments.ts`.
3. Update the Shopify response type and transform in `lib/shopify/transforms/product.ts`.
4. Add the mapped field to `lib/types.ts` if components need it.

### Add a new read operation

1. Define the GraphQL query using existing fragments where possible.
2. Add `"use cache: remote"`, `cacheLife(...)`, and `cacheTag(...)`.
3. Call `shopifyFetch` with the query and variables object.
4. Transform the response before returning it.

### Add a mutation

1. Define the mutation and typed response shape.
2. Call `shopifyFetch` without read-cache directives.
3. If the mutation touches cart state, call `invalidateCartCache()`.
4. Return transformed domain data.

### Debug GraphQL errors

- Set `DEBUG_SHOPIFY=true` in `.env.local` to log Shopify requests with timing and variables.
- Compare every field and argument against `references/schemas/shopify-storefront.graphql`.
- Check whether the wrong fragment is being reused for the surface.

## See also

- `scripts/fetch-references.sh`
- `.agents/skills/fetch-shopify-schema/SKILL.md`
- `references/REFERENCE.md`
- `.claude/recipes/architecture/type-seams.md`
- `.claude/recipes/architecture/caching-strategy.md`
- `.claude/recipes/guides/add-new-product-field.md`
