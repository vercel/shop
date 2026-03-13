# Recipe: Add a New Product Field

> End-to-end guide: Shopify metafield/field → GraphQL fragment → transform → domain type → component.

## When to read this

- Adding a new product attribute (e.g., sustainability score, care instructions)
- Exposing a Shopify metafield in the UI
- Understanding the full pipeline from Shopify data to rendered component

## Key files

| File | Role |
|------|------|
| `.claude/schemas/shopify-storefront.graphql` | Verify field exists in Shopify schema |
| `lib/shopify/fragments.ts` | Add field to GraphQL fragment |
| `lib/shopify/transforms/product.ts` | Map Shopify field → domain type |
| `lib/types.ts` | Add field to domain type |
| Component file | Display the field |

## Step-by-step

### 1. Check the Shopify schema

Open `.claude/schemas/shopify-storefront.graphql` and verify the field exists. For metafields, the query pattern is:

```graphql
metafields(identifiers: [
  {namespace: "custom", key: "your_field"}
]) {
  key
  namespace
  value
  type
}
```

### 2. Add to the GraphQL fragment

**For a standard product field** — add directly to the fragment in `lib/shopify/fragments.ts`:

```tsx
export const PRODUCT_FRAGMENT = `
  ...existing fields...
  yourNewField
`;
```

**For a metafield** — add to the `metafields` identifiers list:

```tsx
export const PRODUCT_FRAGMENT = `
  ...
  metafields(identifiers: [
    ...existing identifiers...
    {namespace: "custom", key: "sustainability_score"},
  ]) {
    ...MetafieldFields
  }
`;
```

If the field should also appear in listings/grids, add it to `CATEGORY_PRODUCT_FRAGMENT` too (but keep it minimal for performance).

### 3. Update the Shopify type

In `lib/shopify/transforms/product.ts`, update the relevant interface:

```tsx
// For PRODUCT_FRAGMENT (PDP)
export interface ShopifyProduct {
  // ...existing fields
  yourNewField?: string;
}

// For CATEGORY_PRODUCT_FRAGMENT (listings) — only if added to that fragment
export interface ShopifyCategoryProduct {
  // ...existing fields
  yourNewField?: string;
}
```

For metafields, no type change is needed — they come through the existing `metafields` array.

### 4. Add to the domain type

In `lib/types.ts`:

```tsx
// For PDP data
export interface ProductDetails extends ProductCard {
  // ...existing fields
  sustainabilityScore?: number;
}

// For card/listing data (only if it should show in grids)
export interface ProductCard {
  // ...existing fields
  sustainabilityScore?: number;
}
```

### 5. Update the transform

In `lib/shopify/transforms/product.ts`:

**For a standard field:**
```tsx
export function transformShopifyProductDetails(product: ShopifyProduct): ProductDetails {
  return {
    // ...existing fields
    sustainabilityScore: product.yourNewField ? parseFloat(product.yourNewField) : undefined,
  };
}
```

**For a metafield:**
```tsx
// Add to METAFIELD_LABELS map if it should show in specs
const METAFIELD_LABELS: Record<string, string> = {
  // ...existing labels
  sustainability_score: "Sustainability Score",
};
```

Or extract it manually in the transform:
```tsx
const sustainabilityField = product.metafields?.find(
  mf => mf?.namespace === "custom" && mf.key === "sustainability_score"
);
return {
  // ...existing fields
  sustainabilityScore: sustainabilityField ? parseFloat(sustainabilityField.value) : undefined,
};
```

### 6. Use in component

```tsx
// Server component
const product = await getProduct(handle, locale);

// The field is now available as a domain type
{product.sustainabilityScore && (
  <SustainabilityBadge score={product.sustainabilityScore} />
)}
```

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Verify the field exists in `.claude/schemas/shopify-storefront.graphql` before adding it — incorrect field names cause silent GraphQL errors
- [ ] GUARDRAIL: Add the domain type field in `lib/types.ts`, not in Shopify types — components must never import from `lib/shopify/types`
- [ ] GUARDRAIL: If adding to `CATEGORY_PRODUCT_FRAGMENT` (listings), keep it minimal — this fragment is used for potentially hundreds of products
- [ ] GUARDRAIL: Make new fields optional (`?`) in domain types — not all products will have the data

## Verification

After implementing:

1. Start dev server: `bun dev`
2. Visit the test product: `http://localhost:3000/products/technest-smart-speaker-pro-jk0c`
3. Verify the field renders correctly
4. Check a listing page to verify card data (if added to `CATEGORY_PRODUCT_FRAGMENT`)
5. Run `bun lint` to check for type errors

## See also

- [Type Seams](../architecture/type-seams.md) — Domain vs Shopify types
- [GraphQL Operations](../shopify/graphql-operations.md) — Query patterns
