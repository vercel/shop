import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  Breadcrumb as BreadcrumbUI,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { getLocale } from "@/lib/params";
import { getCollections } from "@/lib/shopify/operations/collections";

/** Collection handles to exclude from breadcrumbs */
const EXCLUDED_COLLECTION_HANDLES = new Set(["all-products"]);

// TODO: This requires sandbox data cleanup
/** Pattern to match handles ending in hyphen + number (e.g., "apparel-1", "outdoor-2") */
const HYPHEN_NUMBER_SUFFIX_PATTERN = /-\d+$/;

function shouldExcludeCollection(handle: string): boolean {
  return (
    EXCLUDED_COLLECTION_HANDLES.has(handle) ||
    HYPHEN_NUMBER_SUFFIX_PATTERN.test(handle)
  );
}

function Fallback() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

async function Render({ collectionHandles }: { collectionHandles: string[] }) {
  const [t, locale] = await Promise.all([
    getTranslations("product.breadcrumb"),
    getLocale(),
  ]);

  // Fetch all collections to get titles for the handles
  const allCollections = await getCollections(locale);
  const collectionsMap = new Map(
    allCollections.map((c) => [c.handle, c.title]),
  );

  // Build collection items from the product's collectionHandles, deduplicated by title
  const seenTitles = new Set<string>();
  const collectionItems = collectionHandles
    .filter((handle) => !shouldExcludeCollection(handle))
    .map((handle) => ({
      handle,
      title: collectionsMap.get(handle) || handle,
    }))
    .filter((c) => {
      if (!c.title || seenTitles.has(c.title)) return false;
      seenTitles.add(c.title);
      return true;
    });

  return (
    <BreadcrumbUI>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">{t("home")}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {collectionItems.map((collection) => (
          <div key={collection.handle} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/collections/${collection.handle}`}>
                  {collection.title}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </BreadcrumbUI>
  );
}

export function Breadcrumb({
  collectionHandles,
}: {
  collectionHandles: string[];
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Render collectionHandles={collectionHandles} />
    </Suspense>
  );
}
