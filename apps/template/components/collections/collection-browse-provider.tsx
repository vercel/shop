"use client";

import { CollectionProvider, useCollection } from "@shopify/hydrogen/react";
import { Grid2X2Icon, Grid3X3Icon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, use, useContext, useState, type ReactNode } from "react";

import type { BrowseState } from "@/lib/collections/types";

type BrowseDensity = "comfortable" | "compact";

export const BROWSE_GRID_COLUMNS =
  "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 group-data-[density=compact]/browse:grid-cols-3 group-data-[density=compact]/browse:sm:grid-cols-4 group-data-[density=compact]/browse:lg:grid-cols-5 group-data-[density=compact]/browse:xl:grid-cols-6";

interface CollectionBrowseProviderProps {
  children: ReactNode;
  handle: string;
  statePromise: Promise<BrowseState>;
}

const BrowseDensityContext = createContext<{
  density: BrowseDensity;
  setDensity: (density: BrowseDensity) => void;
} | null>(null);

function useBrowseDensity() {
  const context = useContext(BrowseDensityContext);
  if (!context) throw new Error("useBrowseDensity must be used within CollectionBrowseProvider");
  return context;
}

export function BrowseDensityToggle() {
  const { density, setDensity } = useBrowseDensity();
  return (
    <div aria-label="Grid density" className="flex items-center gap-1" role="group">
      <DensityButton
        active={density === "comfortable"}
        label="Comfortable grid"
        onSelect={() => setDensity("comfortable")}
      >
        <Grid2X2Icon className="size-4" />
      </DensityButton>
      <DensityButton
        active={density === "compact"}
        label="Compact grid"
        onSelect={() => setDensity("compact")}
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
  const { density } = useBrowseDensity();
  return (
    <div className="group/browse min-w-0" data-density={density}>
      {children}
    </div>
  );
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
  const [density, setDensity] = useState<BrowseDensity>("comfortable");

  return (
    <CollectionProvider
      data={{ dataSearch, handle }}
      urlSearch={searchParams.toString()}
      onChange={(search) => router.push(`${pathname}${search}`, { scroll: false })}
    >
      <BrowseDensityContext.Provider value={{ density, setDensity }}>
        {children}
      </BrowseDensityContext.Provider>
    </CollectionProvider>
  );
}
