"use client";

import { CollectionProvider, useCollection } from "@shopify/hydrogen/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { use, type ReactNode } from "react";

import { normalizeCollectionBrowseParams } from "@/lib/collections";
import type { CollectionSearchState } from "@/lib/collections/server";

import { FilterTransitionProvider, useFilterTransition } from "./filter-pending-context";

interface CollectionBrowseProviderProps {
  children: ReactNode;
  handle: string;
  searchStatePromise: Promise<CollectionSearchState>;
}

export function CollectionActiveFilterCountBadge() {
  const activeCount = useCollection((state) => state.filters.length);
  if (activeCount === 0) return null;
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
      {activeCount}
    </span>
  );
}

export function CollectionBrowseProvider(props: CollectionBrowseProviderProps) {
  return (
    <FilterTransitionProvider>
      <CollectionBrowseProviderInner {...props} />
    </FilterTransitionProvider>
  );
}

function CollectionBrowseProviderInner({
  children,
  handle,
  searchStatePromise,
}: CollectionBrowseProviderProps) {
  const { dataSearch } = use(searchStatePromise);
  const normalizedDataSearch = normalizeCollectionBrowseParams(
    new URLSearchParams(dataSearch),
  ).toString();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const startTransition = useFilterTransition();

  return (
    <CollectionProvider
      data={{ dataSearch: normalizedDataSearch, handle }}
      urlSearch={normalizeCollectionBrowseParams(searchParams).toString()}
      onChange={(search) => {
        startTransition(() => {
          router.push(`${pathname}${search}`, { scroll: false });
        });
      }}
    >
      {children}
    </CollectionProvider>
  );
}
