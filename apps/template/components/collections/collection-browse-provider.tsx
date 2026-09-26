"use client";

import { CollectionProvider, useCollection } from "@shopify/hydrogen/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { use, type ReactNode } from "react";

import type { BrowseState } from "@/lib/collections/types";

interface CollectionBrowseProviderProps {
  children: ReactNode;
  handle: string;
  statePromise: Promise<BrowseState>;
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

export function CollectionBrowseProvider({
  children,
  handle,
  statePromise,
}: CollectionBrowseProviderProps) {
  const { dataSearch } = use(statePromise);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <CollectionProvider
      data={{ dataSearch, handle }}
      urlSearch={searchParams.toString()}
      onChange={(search) => router.push(`${pathname}${search}`, { scroll: false })}
    >
      {children}
    </CollectionProvider>
  );
}
