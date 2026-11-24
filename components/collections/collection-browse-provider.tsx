"use client";

import { CollectionProvider, useCollection } from "@shopify/hydrogen/react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, use } from "react";

import type { BrowseState } from "@/lib/collections/types";

interface CollectionBrowseProviderProps {
  children: ReactNode;
  handle: string;
  path: string;
  state: BrowseState | Promise<BrowseState>;
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
  path,
  state,
}: CollectionBrowseProviderProps) {
  const { dataSearch } = state instanceof Promise ? use(state) : state;
  const searchParams = useSearchParams();
  const router = useRouter();

  return (
    <CollectionProvider
      data={{ dataSearch, handle }}
      urlSearch={searchParams.toString()}
      onChange={(search) => router.push(`${path}${search}`, { scroll: false })}
    >
      {children}
    </CollectionProvider>
  );
}
