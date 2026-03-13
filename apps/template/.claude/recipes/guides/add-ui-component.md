# Recipe: Add a UI Component

> New compound components follow shadcn conventions: `data-slot` attributes, CVA variants, primitive props only.

## When to read this

- Creating a new compound component (e.g., WishlistCard, ReviewCard)
- Adding a shadcn/ui component to the project
- Understanding the component architecture

## Key files

| File | Role |
|------|------|
| `components/ui/product-card.tsx` | Reference: existing compound component |
| `components/product/product-card-featured.tsx` | Reference: thin wrapper pattern |
| `components/product-card.tsx` | Reference: backwards-compatible export |
| `components.json` | shadcn/ui config (new-york style, Tailwind v4, lucide icons) |
| `lib/utils.ts` | `cn()` utility for className merging |

## Adding a shadcn/ui component

Use the shadcn CLI:

```bash
cd apps/shop
bunx shadcn@latest add button
```

This installs to `components/ui/` following the project's shadcn config.

## Creating a new compound component

### 1. Create the primitives file

Create `components/ui/your-component.tsx`:

```tsx
import type * as React from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// Root
// =============================================================================

interface YourComponentProps extends React.ComponentProps<"div"> {
  variant?: "default" | "compact";
}

function YourComponent({ variant = "default", className, children, ...props }: YourComponentProps) {
  return (
    <div
      data-slot="your-component"
      data-variant={variant}
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function YourComponentTitle({ className, children, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="your-component-title"
      className={cn("text-base font-medium", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

function YourComponentDescription({ className, children, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="your-component-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export { YourComponent, YourComponentTitle, YourComponentDescription };
```

### 2. Create a thin wrapper (if needed)

Create `components/your-domain/your-component-wrapper.tsx`:

```tsx
import type { YourDomainType } from "@/lib/types";
import {
  YourComponent,
  YourComponentTitle,
  YourComponentDescription,
} from "@/components/ui/your-component";

export function YourComponentWrapper({ data }: { data: YourDomainType }) {
  return (
    <YourComponent>
      <YourComponentTitle>{data.title}</YourComponentTitle>
      <YourComponentDescription>{data.description}</YourComponentDescription>
    </YourComponent>
  );
}
```

### 3. Checklist

- [ ] Every primitive has a `data-slot` attribute
- [ ] Variants use `data-variant` + Tailwind `data-[variant=x]:` selectors
- [ ] Props are primitive types (string, number, boolean, React.ReactNode)
- [ ] No imports from `@/lib/types` (except `Money`, `Image` primitives)
- [ ] No `useTranslations` calls — translated text comes via props
- [ ] `className` prop supported via `cn()` merging
- [ ] Spread `...props` for HTML attribute forwarding

## Conventions

### Data attributes

```tsx
// Root element: data-slot="component-name"
<div data-slot="product-card">

// Sub-elements: data-slot="component-name-part"
<h3 data-slot="product-card-title">
<div data-slot="product-card-image">

// Variants: data-variant="variant-name"
<article data-variant="featured">
```

### Styling with data attributes

Prefer Tailwind data-attribute selectors over conditional classes:

```tsx
// Preferred
className="data-[variant=featured]:bg-primary"

// Avoid
className={cn(variant === "featured" && "bg-primary")}
```

### Component props

```tsx
// Extend HTML element props for full attribute forwarding
interface Props extends React.ComponentProps<"div"> {
  variant?: "default" | "compact";
}

// Use cn() for className merging
function Component({ variant, className, children, ...props }: Props) {
  return (
    <div className={cn("base-styles", className)} {...props}>
      {children}
    </div>
  );
}
```

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: UI primitives in `components/ui/` must NOT import domain types — accept primitive props only
- [ ] GUARDRAIL: Every compound primitive must have a `data-slot` attribute — this is the public API for external styling and testing
- [ ] GUARDRAIL: Never call `useTranslations` in `components/ui/` — keep primitives locale-agnostic

## See also

- [Compound Components](../architecture/compound-components.md) — Architecture deep-dive
- [Type Seams](../architecture/type-seams.md) — Why UI primitives don't import domain types
