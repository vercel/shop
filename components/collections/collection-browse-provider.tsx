"use client";

import { CollectionProvider, useCollection } from "@shopify/hydrogen/react";
import { Grid2X2Icon, Grid3X3Icon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { use, type ReactNode } from "react";

import {
  BROWSE_DENSITY_RESTORE_SCRIPT,
  useBrowseDensityValue,
  writeBrowseDensity,
} from "@/lib/collections/client";
import type { BrowseDensity, BrowseState } from "@/lib/collections/types";

export const BROWSE_GRID_COLUMNS =
  "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 group-data-[density=compact]/browse:grid-cols-3 group-data-[density=compact]/browse:sm:grid-cols-4 group-data-[density=compact]/browse:lg:grid-cols-5 group-data-[density=compact]/browse:xl:grid-cols-6";

interface CollectionBrowseProviderProps {
  children: ReactNode;
  handle: string;
  statePromise: Promise<BrowseState>;
}

export function BrowseDensityToggle() {
  const density = useBrowseDensityValue();
  return (
    <div aria-label="Grid density" className="flex items-center gap-1" role="group">
      <DensityButton
        active={density === "comfortable"}
        label="Comfortable grid"
        onSelect={() => writeBrowseDensity("comfortable")}
      >
        <Grid2X2Icon className="size-4" />
      </DensityButton>
      <DensityButton
        active={density === "compact"}
        label="Compact grid"
        onSelect={() => writeBrowseDensity("compact")}
      >
        <Grid3X3Icon className="size-4" />
      </DensityButton>
    </div>
  );
}

function DensityButton({
  active,
  children,
  label,
  onSelect,
}: {
  active: boolean;
  children: ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground aria-pressed:text-foreground"
      onClick={onSelect}
      type="button"
    >
      {children}
    </button>
  );
}

export function BrowseGridArea({ children }: { children: ReactNode }) {
  const density = useBrowseDensityValue();
  return <BrowseDensityArea density={density}>{children}</BrowseDensityArea>;
}

// The fallback renders before the grid's client subtree, so it takes the density the restore script
// applies. Without this wrapper the skeleton loses the compact column variants entirely.
export function BrowseDensityArea({
  children,
  density = "comfortable",
}: {
  children: ReactNode;
  density?: BrowseDensity;
}) {
  return (
    <div
      className="group/browse min-w-0"
      data-browse-results=""
      data-density={density}
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: BROWSE_DENSITY_RESTORE_SCRIPT }} />
      {children}
    </div>
  );
}

// A new filter or sort rebuilds the grid from its first page, so a shopper who had scrolled through
// several pages would otherwise be left in the whitespace below the shorter result set.
function scrollResultsIntoView(): void {
  const results = document.querySelector("[data-browse-results]");
  if (!results || results.getBoundingClientRect().top >= 0) return;
  results.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  });
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
      onChange={(search) => {
        router.push(`${pathname}${search}`, { scroll: false });
        scrollResultsIntoView();
      }}
    >
      {children}
    </CollectionProvider>
  );
}
