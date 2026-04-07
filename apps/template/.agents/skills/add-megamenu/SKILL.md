---
name: add-megamenu
description: Add a megamenu to the site navigation powered by a Shopify menu. Prompts for the menu handle, then creates the megamenu component (desktop + mobile), data operation, types, and wires it into the nav header.
---

# Add Megamenu

Add a full-featured megamenu to the site navigation, powered by a Shopify Navigation menu. The megamenu supports 3 levels of hierarchy, responsive desktop/mobile layouts, hover intent detection, keyboard navigation, and BroadcastChannel cross-tab sync.

## Before you start

Ask the user:

> This skill will add a megamenu to your navigation bar powered by a Shopify menu. What is the **handle** of the Shopify menu you'd like to use? (e.g. `main-menu`)

Wait for the user to provide the menu handle before proceeding. Use that handle as `MENU_HANDLE` in the steps below.

## Prerequisites

- A Shopify Navigation menu exists with the handle the user provides
- The menu should have up to 3 levels of nesting (top-level items → subcategories → leaf links)
- `react-remove-scroll` is installed (`pnpm add react-remove-scroll`)

## Data model

The megamenu transforms a Shopify 3-level nested menu into this hierarchy:

| Type | Level | Description |
| --- | --- | --- |
| `MegamenuItem` | 1 | Top-level nav trigger (e.g. "Clothing") |
| `MegamenuPanel` | 2 | Subcategory grouping (e.g. "Tops") |
| `MegamenuCategory` | 3 | Leaf link (e.g. "T-Shirts") |

```ts
// MegamenuData
{
  items: MegamenuItem[] // Top-level items shown in left column
}

// MegamenuItem
{
  id: string
  label: string
  href: string | null
  panels: MegamenuPanel[] // Subcategories shown in right column
}

// MegamenuPanel
{
  id: string
  header: string
  href: string | null
  categories: MegamenuCategory[] // Leaf links
}

// MegamenuCategory
{
  href: string
  title: string
}
```

## Implementation steps

### 1. Install dependency

```bash
pnpm add react-remove-scroll
```

### 2. Create `lib/shopify/types/megamenu.ts`

Define the four types (`MegamenuCategory`, `MegamenuPanel`, `MegamenuItem`, `MegamenuData`) exactly as shown in the data model above.

### 3. Create `lib/shopify/operations/megamenu.ts`

Fetch the Shopify menu by handle and transform it into `MegamenuData`:

```ts
import { defaultLocale } from "@/lib/i18n";

import type {
  MegamenuCategory,
  MegamenuData,
  MegamenuItem,
  MegamenuPanel,
} from "../types/megamenu";
import { getMenu } from "./menu";

export async function getMegamenuData(locale: string = defaultLocale): Promise<MegamenuData> {
  const menu = await getMenu("MENU_HANDLE", locale);

  if (!menu || menu.items.length === 0) {
    return { items: [] };
  }

  const items: MegamenuItem[] = menu.items.map((topItem) => ({
    id: topItem.id,
    label: topItem.title,
    href: topItem.url,
    panels: topItem.items.map(
      (subItem): MegamenuPanel => ({
        id: subItem.id,
        header: subItem.title,
        href: subItem.url || null,
        categories: subItem.items.map(
          (child): MegamenuCategory => ({
            href: child.url,
            title: child.title,
          }),
        ),
      }),
    ),
  }));

  return { items };
}
```

Replace `"MENU_HANDLE"` with the handle the user provided.

This relies on `getMenu()` from `lib/shopify/operations/menu.ts` which already exists and supports 3-level nesting with `"use cache: remote"`, `cacheLife("max")`, and `cacheTag("menus")`.

### 4. Create megamenu components

Create a directory `components/layout/nav/megamenu/` with the following files:

#### 4a. `menu-trigger-icon.tsx`

A simple SVG hamburger icon component:

```tsx
import type { SVGProps } from "react";

export function MenuTriggerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      data-testid="geist-icon"
      height="16"
      width="16"
      viewBox="0 0 16 16"
      strokeLinejoin="round"
      style={{ color: "currentcolor" }}
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.75 4H1V5.5H1.75H14.25H15V4H14.25H1.75ZM1.75 10.5H1V12H1.75H14.25H15V10.5H14.25H1.75Z"
        fill="currentColor"
      />
    </svg>
  );
}
```

#### 4b. `mouse-safe-area.tsx`

A UX utility that prevents accidental menu switches when moving diagonally toward the content panel. It creates an invisible clipped polygon between the trigger column and the panel:

```tsx
"use client";

import { type RefObject, useEffect, useRef } from "react";

type Props = {
  parentRef: RefObject<HTMLDivElement | null>;
};

export function MouseSafeArea({ parentRef }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rect: DOMRect | null = null;

    function updateRect() {
      rect = parentRef.current?.getBoundingClientRect() ?? null;
    }

    function handleMouseMove(e: MouseEvent) {
      const el = ref.current;
      if (!el || !rect) return;

      if (e.clientX >= rect.x) {
        el.style.display = "none";
        return;
      }

      const offset = e.clientX - rect.x;
      const mouseYPercent = ((e.clientY - rect.y) / rect.height) * 100;

      el.style.display = "";
      el.style.left = `${offset}px`;
      el.style.width = `${-offset}px`;
      el.style.height = `${rect.height}px`;
      el.style.clipPath = `polygon(100% 0%, 0% ${mouseYPercent}%, 100% 100%)`;
    }

    updateRect();
    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", updateRect);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", updateRect);
    };
  }, [parentRef]);

  return (
    <div
      ref={ref}
      aria-hidden
      style={{ position: "absolute", top: 0, zIndex: 10, display: "none" }}
    />
  );
}
```

#### 4c. `megamenu-panel.tsx`

Renders a single panel's header and category links. Supports both internal (Next.js `Link`) and external (`<a>`) links:

```tsx
"use client";

import Link from "next/link";

import type { MegamenuPanel as MegamenuPanelType } from "@/lib/shopify/types/megamenu";

type Props = {
  panel: MegamenuPanelType;
  fallbackHeader: string;
  onLinkClick?: () => void;
};

export function MegamenuPanel({ panel, fallbackHeader, onLinkClick }: Props) {
  return (
    <section className="min-w-0 space-y-5">
      {panel.href ? (
        <h4>
          {panel.href.startsWith("http") ? (
            <a
              href={panel.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:rounded-sm"
            >
              {panel.header || fallbackHeader}
            </a>
          ) : (
            <Link
              href={panel.href}
              onClick={onLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:rounded-sm"
            >
              {panel.header || fallbackHeader}
            </Link>
          )}
        </h4>
      ) : (
        <h4 className="text-sm font-medium text-muted-foreground">
          {panel.header || fallbackHeader}
        </h4>
      )}
      <ul className="space-y-3">
        {panel.categories.map((category) => {
          const isExternal = category.href.startsWith("http");

          return (
            <li key={category.href}>
              {isExternal ? (
                <a
                  href={category.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onLinkClick}
                  className="block truncate text-base font-medium text-foreground transition-colors hover:text-foreground/80 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:rounded-sm"
                >
                  {category.title}
                </a>
              ) : (
                <Link
                  href={category.href}
                  onClick={onLinkClick}
                  className="block truncate text-base font-medium text-foreground transition-colors hover:text-foreground/80 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:rounded-sm"
                >
                  {category.title}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

#### 4d. `megamenu-client.tsx`

The desktop megamenu client component. This is the largest component and includes:

- **BroadcastChannel sync** — cross-tab open/close/toggle coordination
- **Hover intent detection** — delays switching when mouse moves toward the panel (150ms), switches immediately otherwise
- **Keyboard navigation** — Escape to close
- **RemoveScroll** — prevents body scroll when menu is open
- **Full-height overlay** — backdrop blur with gradient

Key behavior:
- Top-level items render as `Link` (internal), `<a>` (external), or `<button>` (no href)
- Each item uses `data-active` attribute for styling the active indicator dot
- Active item's panels render in the right column
- A "Show all {category}" link appears below the panels when the active item has an `href`

The component accepts `items: MegamenuItem[]` and optional `children` (rendered in a footer below the nav list).

It uses translation keys from the `nav` namespace:
- `categories` — trigger button label
- `exploreCategories` — heading above the nav list
- `showAllCategory` — "Show all {category}" link text (with `{category}` interpolation)

Export both `MegamenuClient` and `MegamenuFallback` from this file. The fallback renders a disabled-looking trigger with the hamburger icon and "Browse" label.

#### 4e. `megamenu-desktop.tsx`

A thin server component wrapper that renders `MegamenuClient` only when items are non-empty:

```tsx
import type { MegamenuItem } from "@/lib/shopify/types/megamenu";

import { MegamenuClient } from "./megamenu-client";

type Props = {
  items: MegamenuItem[];
  children?: React.ReactNode;
};

export function MegamenuDesktop({ items, children }: Props) {
  if (!items.length) {
    return null;
  }

  return <MegamenuClient items={items}>{children}</MegamenuClient>;
}
```

#### 4f. `megamenu-mobile.tsx`

The mobile megamenu component using the shadcn `Accordion` component. Key differences from desktop:

- Uses `Accordion` (`type="single"`, `collapsible`) for expand/collapse
- Top-level items with sub-items get an accordion trigger; items with only an href get a plain link
- No hover intent — touch-only interaction
- Uses the same BroadcastChannel sync, RemoveScroll, and Escape key handling
- Panels render inline within the accordion content

The component accepts `data: MegamenuData` and optional `children`.

Export both `MegamenuMobile` and `MegamenuMobileFallback` (renders `null`).

#### 4g. `index.tsx` (barrel)

The main entry point. A server component that fetches data and renders both layouts:

```tsx
import { Suspense } from "react";

import { getMegamenuData } from "@/lib/shopify/operations/megamenu";

import { MegamenuFallback } from "./megamenu-client";
import { MegamenuDesktop } from "./megamenu-desktop";
import { MegamenuMobile, MegamenuMobileFallback } from "./megamenu-mobile";

type MegamenuProps = {
  locale: string;
};

async function MegamenuContent({ locale }: MegamenuProps) {
  const data = await getMegamenuData(locale);
  return (
    <>
      <div className="hidden md:block">
        <MegamenuDesktop items={data.items} />
      </div>

      <MegamenuMobile data={data} />
    </>
  );
}

function MegamenuCombinedFallback() {
  return (
    <>
      <div className="hidden md:block">
        <MegamenuFallback />
      </div>
      <MegamenuMobileFallback />
    </>
  );
}

export function Megamenu({ locale }: MegamenuProps) {
  return (
    <Suspense fallback={<MegamenuCombinedFallback />}>
      <MegamenuContent locale={locale} />
    </Suspense>
  );
}
```

### 5. Add translation keys

Add the following keys to **all** locale files under `lib/i18n/messages/` in the `nav` namespace (if not already present):

```json
{
  "nav": {
    "categories": "Browse",
    "exploreCategories": "Explore categories",
    "showAllCategory": "Show all {category}"
  }
}
```

### 6. Wire into the nav

Import and render the `Megamenu` component in `components/layout/nav/index.tsx`, passing `locale`:

```tsx
import { Megamenu } from "./megamenu";

// Inside the nav bar, after the logo link:
<Suspense fallback={null}>
  <Megamenu locale={locale} />
</Suspense>
```

Place it between the logo and any quick-links/search components.

### 7. Ensure the Accordion component exists

The mobile megamenu requires the shadcn `Accordion` component. If it doesn't exist yet:

```bash
npx shadcn@latest add accordion
```

### 8. Add Browse toggle to the bottom bar

The bottom bar (`components/layout/bottom-bar.tsx`) should include a Browse button that toggles the megamenu on mobile. Add:

1. Import `MenuTriggerIcon` from `./nav/megamenu/menu-trigger-icon` and `X` from `lucide-react`
2. Add state: `const [menuOpen, setMenuOpen] = useState(false)`
3. Add BroadcastChannel listener for `"megamenu"` close events (in a `useEffect`)
4. Add a `toggleMenu` function that posts `{ type: "toggle" }` on the `"megamenu"` BroadcastChannel
5. Add the toggle button before the search button in the bottom bar:

```tsx
<button
  type="button"
  className="flex md:hidden items-center gap-1.5 px-2 py-1"
  onClick={toggleMenu}
>
  {menuOpen ? (
    <X className="size-4 text-foreground opacity-50" />
  ) : (
    <MenuTriggerIcon className="size-4 text-foreground opacity-50" />
  )}
  <span className="text-xs font-medium text-foreground opacity-50">Browse</span>
</button>
<div className="w-px h-5 bg-border/50 md:hidden" />
```

### 9. Add collection breadcrumb ancestor paths (optional)

To show rich breadcrumbs on collection pages (e.g. Home / Clothing / Tops / T-Shirts), create `lib/utils/breadcrumbs.ts` with:

- `buildCollectionAncestorPath(handle, menu)` — walks the megamenu tree to find a collection by its `/collections/{handle}` href and returns ancestor segments
- `buildProductCategoryPath(category, menu, collectionHandles?)` — finds the deepest menu path for a product by matching its collection handles against megamenu hrefs

Then update `components/collections/header.tsx` and `components/collections/structured-data.tsx` to:
1. Import `getMegamenuData` and `buildCollectionAncestorPath`
2. Add `getMegamenuData(locale)` to their `Promise.all` calls
3. Use `buildCollectionAncestorPath(handle, menu)` to render ancestor breadcrumb segments before the current collection title

## Guardrails

- The `getMenu()` operation from `lib/shopify/operations/menu.ts` already handles caching (`"use cache: remote"`, `cacheTag("menus")`) and URL transformation. Do not duplicate that logic.
- Components in `components/layout/nav/megamenu/` may import from `@/lib/shopify/types/megamenu` for prop types, but must not call Shopify operations directly — data fetching happens in the server component barrel (`index.tsx`).
- All user-visible strings must use `useTranslations("nav")` — no hardcoded English text in components.
- The BroadcastChannel name must be `"megamenu"` for cross-tab sync to work.
- External links (starting with `http`) must use `<a>` with `target="_blank"` and `rel="noopener noreferrer"`. Internal links must use Next.js `Link`.
- The mobile component renders on all viewports but is only visible below `md`. Desktop uses `hidden md:block`.
