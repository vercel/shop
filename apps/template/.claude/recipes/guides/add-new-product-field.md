# Recipe: Add a New Product Field

> End-to-end guide: provider API field → API request → transform → domain type → component.

## When to read this

- Adding a new product attribute (e.g., sustainability score, care instructions)
- Exposing a provider-specific field or custom metadata in the UI
- Understanding the full pipeline from commerce data to rendered component

## Key files

| File | Role |
|------|------|
| `.claude/schemas/` | Verify field exists in provider API |
| `lib/commerce/providers/<name>/operations/products.ts` | Update API request to include field |
| `lib/commerce/providers/<name>/transforms/product.ts` | Map provider field → domain type |
| `lib/commerce/providers/<name>/types.ts` | Provider response type |
| `lib/types.ts` | Add field to domain type |
| Component file | Display the field |

## Step-by-step

### 1. Check the provider API

Open your provider's API reference in `.claude/schemas/` (or search the provider's documentation) and verify the field exists. Understand:
- What the field is called in the provider's response
- Whether it's a standard field or custom metadata
- Whether it's included by default or requires an explicit request

### 2. Update the API request

How you include a new field depends on your provider's protocol:

**REST providers** — the field may already be in the response. If not, check if the endpoint supports a `fields` or `include` parameter:

```tsx
// The field might already be in the response — check first
const data = await providerFetch<ProviderProduct>({
  endpoint: `/products/${handle}?include=custom_fields`,
});
```

**GraphQL providers** — add the field to the appropriate query fragment:

```tsx
// Add to your product query
const PRODUCT_QUERY = `
  ...existing fields...
  yourNewField
`;
```

**For custom metadata** (metafields, custom attributes, etc.) — consult your provider's docs for how to request them. Each provider handles this differently:
- Some include all metadata by default
- Some require explicit field names in the request
- Some expose metadata through a separate endpoint

### 3. Update the provider type

In `lib/commerce/providers/<name>/types.ts`, update the relevant interface:

```tsx
export interface ProviderProduct {
  // ...existing fields
  yourNewField?: string;
}
```

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

In `lib/commerce/providers/<name>/transforms/product.ts`:

**For a standard field:**
```tsx
export function transformProductDetails(product: ProviderProduct): ProductDetails {
  return {
    // ...existing fields
    sustainabilityScore: product.yourNewField ? parseFloat(product.yourNewField) : undefined,
  };
}
```

**For custom metadata:**
```tsx
// If the provider returns metadata as key-value pairs:
const sustainabilityField = product.metadata?.find(
  mf => mf.key === "sustainability_score"
);
return {
  // ...existing fields
  sustainabilityScore: sustainabilityField ? parseFloat(sustainabilityField.value) : undefined,
};
```

Or add to a label map if the field should show in a specs/details section:
```tsx
const METADATA_LABELS: Record<string, string> = {
  // ...existing labels
  sustainability_score: "Sustainability Score",
};
```

### 6. Use in component

```tsx
// Server component
const product = await commerce.products.getProduct(handle, locale);

// The field is now available as a domain type
{product.sustainabilityScore && (
  <SustainabilityBadge score={product.sustainabilityScore} />
)}
```

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Verify the field exists in your provider's API before adding it — incorrect field names cause silent errors
- [ ] GUARDRAIL: Add the domain type field in `lib/types.ts`, not in provider types — components must never import from provider-specific type files
- [ ] GUARDRAIL: If adding the field to listing/grid queries, keep it minimal — these queries run for potentially hundreds of products
- [ ] GUARDRAIL: Make new fields optional (`?`) in domain types — not all products will have the data

## Verification

After implementing:

1. Start dev server: `pnpm dev`
2. Visit a product page and verify the field renders correctly
3. Check a listing page to verify card data (if added to listings)
4. Run `pnpm lint` to check for type errors

## See also

- [Type Seams](../architecture/type-seams.md) — Domain vs provider types
- [Commerce Operations](../commerce/operations.md) — Operation patterns
