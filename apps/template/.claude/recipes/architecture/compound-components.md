# Recipe: Compound Components

> Complex UI uses a three-layer pattern: `ui/` primitives (pure presentation) → `product/` wrappers (data mapping) → backwards-compatible exports.

## When to read this

- Creating a new compound component
- Modifying the ProductCard or other compound components
- Understanding why there are three files for one component

## Key files

| File | Role |
|------|------|
| `components/ui/product-card.tsx` | Compound primitives — pure presentation, no business types |
| `components/product/product-card-featured.tsx` | Thin wrapper — maps `ProductCard` type → compound components |
| `components/product/product-card-default.tsx` | Thin wrapper — default variant |
| `components/product-card.tsx` | Backwards-compatible export — used by existing code |
| `components.json` | shadcn/ui config (new-york style, Tailwind v4) |

## How it works

### Three-layer architecture

```
Layer 1: components/ui/product-card.tsx
  → Compound primitives (ProductCard, ProductCardImage, ProductCardTitle, etc.)
  → Accept primitive props (strings, numbers, Money)
  → No imports from @/lib/types (except Money, Image primitives)
  → Use data-slot attributes for styling hooks

Layer 2: components/product/product-card-featured.tsx
  → Thin wrappers that map domain types to compound primitives
  → Import ProductCard type from @/lib/types
  → Compose the compound components in a specific layout

Layer 3: components/product-card.tsx
  → Backwards-compatible export
  → Accepts (product, locale, variant) and renders the right layout
  → Existing code continues to work without changes
```

### Compound component conventions

Each primitive follows these patterns:

1. **`data-slot` attribute** — For external styling and testing:
   ```tsx
   <div data-slot="product-card-image" className={...}>
   ```

2. **`data-variant` for variants** — Instead of conditional classes:
   ```tsx
   <article data-variant={variant} className="data-[variant=featured]:...">
   ```

3. **Primitive props only** — `string`, `number`, `boolean`, `Money`, `React.ReactNode`:
   ```tsx
   // Correct: primitive props
   interface ProductCardPriceProps {
     price: Money;
     locale: string;
   }

   // Wrong: business types
   interface ProductCardPriceProps {
     product: ProductCard;
   }
   ```

4. **Spread remaining props** — For className and other HTML attributes:
   ```tsx
   function ProductCardTitle({ className, children, ...props }: React.ComponentProps<"h3">) {
     return <h3 data-slot="product-card-title" className={cn("...", className)} {...props}>{children}</h3>;
   }
   ```

### Existing compound components

| Component | Primitives file | Wrappers |
|-----------|----------------|----------|
| ProductCard | `ui/product-card.tsx` | `product/product-card-featured.tsx`, `product/product-card-default.tsx`, `product-card.tsx` |
| Card | `ui/card.tsx` | — |
| SelectPanel | `ui/select-panel.tsx` | — |

### ProductCard primitives

```tsx
import { ProductCard, ProductCardBadge, ProductCardImageContainer,
  ProductCardImage, ProductCardContent, ProductCardRating,
  ProductCardTitle, ProductCardPrice, ProductCardSkeleton
} from "@/components/ui/product-card";
```

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Components in `ui/` must NOT import domain types from `@/lib/types` (except shared primitives like `Money`, `Image`) — accept translated text and primitive values via props
- [ ] GUARDRAIL: Components in `ui/` must NOT call `useTranslations` — accept translated text via props to keep them locale-agnostic
- [ ] GUARDRAIL: Every compound primitive must have a `data-slot` attribute — this is the public API for external styling
- [ ] GUARDRAIL: Thin wrappers in `product/` should be <50 lines — if they grow, the logic belongs in the primitive or a hook

## Common modifications

### Adding a new sub-component to ProductCard

1. Add the primitive in `components/ui/product-card.tsx`:
   ```tsx
   function ProductCardVendor({ className, children, ...props }: React.ComponentProps<"span">) {
     return (
       <span data-slot="product-card-vendor" className={cn("text-xs text-muted-foreground", className)} {...props}>
         {children}
       </span>
     );
   }
   ```
2. Export it from the file
3. Use it in the thin wrappers (`product/product-card-featured.tsx`, etc.)
4. Update the backwards-compatible export if needed

### Creating a new compound component

Follow the ProductCard pattern:

1. Create `components/ui/my-component.tsx` with compound primitives
2. Use `data-slot` attributes on each primitive
3. Accept only primitive props (no business types)
4. Create thin wrappers in the appropriate domain folder
5. Optionally create a backwards-compatible export

**When to use this pattern:**
- Component has 3+ distinct visual sections
- Design changes independently per section
- Need both "quick use" (wrapper) and "custom layout" (compound) APIs
- Component is used across many pages with slight variations

## See also

- [Add UI Component](../guides/add-ui-component.md) — Step-by-step guide for new compound components
- [Type Seams](./type-seams.md) — Why UI primitives don't import domain types
