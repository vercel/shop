"use client";

import { CollectionProvider, useCollection } from "@shopify/hydrogen/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  type ReactNode,
  use,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";

import type { BrowseState } from "@/lib/collections/types";
import type { Facets } from "@/lib/filters/types";

interface CollectionBrowseProviderProps {
  children: ReactNode;
  handle: string;
  path: string;
  state: BrowseState | Promise<BrowseState>;
}

interface CollectionBrowseFrameProps {
  children: ReactNode;
  handle: string;
  path: string;
}

interface BrowsePublisherProps {
  dataSearch: string;
  facets: Facets;
}

interface BrowseStoreProps {
  children: ReactNode;
  dataSearch: string;
  handle: string;
  path: string;
  urlSearch: string;
}

interface BrowsePublication {
  dataSearch: string;
  facets: Facets | null;
  urlSearch: string;
}

type BrowsePublicationStore = ReturnType<typeof createBrowsePublicationStore>;

const BrowsePublicationContext = createContext<BrowsePublicationStore | null>(null);

function createBrowsePublicationStore() {
  let publication: BrowsePublication = { dataSearch: "", facets: null, urlSearch: "" };
  let isPublished = false;
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  return {
    adoptUrl: (urlSearch: string) => {
      if (isPublished) return;
      publication = { ...publication, urlSearch };
      notify();
    },
    get: () => publication,
    publish: (next: BrowsePublication) => {
      isPublished = true;
      publication = next;
      notify();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function subscribeToNothing() {
  return () => {};
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

export function CollectionBrowseProvider({ state, ...props }: CollectionBrowseProviderProps) {
  const { dataSearch } = state instanceof Promise ? use(state) : state;
  const searchParams = useSearchParams();
  return <BrowseStore {...props} dataSearch={dataSearch} urlSearch={searchParams.toString()} />;
}

// The collection layout owns the store, so the toolbar and filter sheet stay mounted when a filter switches between the static and refine routes; each page publishes the results it rendered.
export function CollectionBrowseFrame({ children, handle, path }: CollectionBrowseFrameProps) {
  const [store] = useState(createBrowsePublicationStore);
  const { dataSearch, urlSearch } = useSyncExternalStore(store.subscribe, store.get, store.get);
  // Until a page publishes its results, the store follows the URL with an empty data search, so it reads as loading and a sort or filter change starts from the URL.
  useLayoutEffect(() => store.adoptUrl(window.location.search.slice(1)), [store]);
  return (
    <BrowsePublicationContext value={store}>
      <BrowseStore dataSearch={dataSearch} handle={handle} path={path} urlSearch={urlSearch}>
        {children}
      </BrowseStore>
    </BrowsePublicationContext>
  );
}

// Next.js updates the URL in an insertion effect, so location already matches the page being committed, unrelated params such as utm_* included.
export function BrowsePublisher({ dataSearch, facets }: BrowsePublisherProps) {
  const store = use(BrowsePublicationContext);
  useLayoutEffect(() => {
    store?.publish({ dataSearch, facets, urlSearch: window.location.search.slice(1) });
  }, [dataSearch, facets, store]);
  return null;
}

export function usePublishedFacets(): Facets | null {
  const store = use(BrowsePublicationContext);
  return useSyncExternalStore(
    store?.subscribe ?? subscribeToNothing,
    () => store?.get().facets ?? null,
    () => null,
  );
}

function BrowseStore({ children, dataSearch, handle, path, urlSearch }: BrowseStoreProps) {
  const router = useRouter();

  return (
    <CollectionProvider
      data={{ dataSearch, handle }}
      urlSearch={urlSearch}
      onChange={(search) => router.push(`${path}${search}`, { scroll: false })}
    >
      {children}
    </CollectionProvider>
  );
}
