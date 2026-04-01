import type { MegamenuData } from "@/lib/types";
import type { Category } from "@/lib/types";

export interface BreadcrumbSegment {
  label: string;
  href: string | null;
}

/**
 * Find a node in the megamenu by normalized name and return the full path
 * from root to that node (inclusive).
 */
function findMenuPathByName(name: string, menu: MegamenuData): BreadcrumbSegment[] | null {
  const target = name.toLowerCase().trim();

  for (const item of menu.items) {
    if (item.label.toLowerCase().trim() === target) {
      return [{ label: item.label, href: item.href }];
    }

    for (const panel of item.panels) {
      if (panel.header.toLowerCase().trim() === target) {
        return [
          { label: item.label, href: item.href },
          { label: panel.header, href: panel.href },
        ];
      }

      for (const cat of panel.categories) {
        if (cat.title.toLowerCase().trim() === target) {
          return [
            { label: item.label, href: item.href },
            { label: panel.header, href: panel.href },
            { label: cat.title, href: cat.href },
          ];
        }
      }
    }
  }

  return null;
}

/**
 * Compare two collection hrefs ignoring trailing `-\d+` suffixes
 * that some providers append to duplicate collections.
 */
function handleMatches(a: string, b: string): boolean {
  return a.replace(/-\d+$/, "") === b.replace(/-\d+$/, "");
}

/**
 * Find the deepest menu path for a product by matching its collection handles
 * against the megamenu hrefs. Normalizes handles to ignore duplicate
 * collection suffixes. Exits early when max depth (3) is reached.
 */
function findDeepestCollectionPath(handles: string[], menu: MegamenuData): BreadcrumbSegment[] {
  let best: BreadcrumbSegment[] = [];

  for (const handle of handles) {
    const target = `/collections/${handle}`;

    for (const item of menu.items) {
      if (!item.href) continue;

      if (handleMatches(item.href, target)) {
        if (best.length < 1) best = [{ label: item.label, href: item.href }];
        continue;
      }

      for (const panel of item.panels) {
        if (panel.href && handleMatches(panel.href, target) && best.length < 2) {
          best = [
            { label: item.label, href: item.href },
            { label: panel.header, href: panel.href },
          ];
          continue;
        }

        for (const cat of panel.categories) {
          if (cat.href && handleMatches(cat.href, target)) {
            return [
              { label: item.label, href: item.href },
              { label: panel.header, href: panel.href },
              { label: cat.title, href: cat.href },
            ];
          }
        }
      }
    }
  }

  return best;
}

/**
 * Build breadcrumb segments for a product by finding its collections in the megamenu.
 *
 * Strategy 1 (preferred): Match product collection handles against menu hrefs
 * (URL-based, same reliable approach the collection page uses).
 *
 * Strategy 2 (fallback): Match taxonomy category names against menu labels.
 */
export function buildProductCategoryPath(
  category: Category | null | undefined,
  menu: MegamenuData,
  collectionHandles?: string[],
): BreadcrumbSegment[] {
  // Strategy 1: URL-based matching via collection handles
  if (collectionHandles && collectionHandles.length > 0) {
    const collectionPath = findDeepestCollectionPath(collectionHandles, menu);
    if (collectionPath.length > 0) return collectionPath;
  }

  // Strategy 2: name-based matching via taxonomy category
  if (!category) return [];

  const chain = [...category.ancestors, { id: category.id, name: category.name }];

  for (let i = chain.length - 1; i >= 0; i--) {
    const path = findMenuPathByName(chain[i].name, menu);
    if (path) return path;
  }

  return [];
}

/**
 * Find a collection's ancestors in the megamenu tree by matching its handle.
 * Returns ancestor segments (excluding the matched node itself).
 * Returns null if the collection is not found in the menu.
 */
export function buildCollectionAncestorPath(
  handle: string,
  menu: MegamenuData,
): BreadcrumbSegment[] | null {
  const targetPath = `/collections/${handle}`;

  for (const item of menu.items) {
    if (item.href === targetPath) {
      return [];
    }

    for (const panel of item.panels) {
      if (panel.href === targetPath) {
        return [{ label: item.label, href: item.href }];
      }

      for (const cat of panel.categories) {
        if (cat.href === targetPath) {
          return [
            { label: item.label, href: item.href },
            { label: panel.header, href: panel.href },
          ];
        }
      }
    }
  }

  return null;
}
