"use client";

import { useSyncExternalStore } from "react";

import type { BrowseDensity } from "@/lib/collections/types";

const BROWSE_DENSITY_KEY = "template-browse-density-v1";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

// Session, not local: a density choice belongs to the browsing session the shopper made it in.
function readBrowseDensity(): BrowseDensity {
  try {
    return sessionStorage.getItem(BROWSE_DENSITY_KEY) === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

export function writeBrowseDensity(density: BrowseDensity): void {
  try {
    sessionStorage.setItem(BROWSE_DENSITY_KEY, density);
  } catch {
    /* The grid still toggles without browser storage; the choice just does not outlive the page. */
  }
  for (const onChange of listeners) onChange();
}

// The server cannot read the store, so it renders the default and the client adopts the stored choice on
// hydration. Storage stays the single source of truth, so every browse surface agrees without prop drilling.
export function useBrowseDensityValue(): BrowseDensity {
  return useSyncExternalStore(subscribe, readBrowseDensity, () => "comfortable");
}

// Runs while the grid markup parses, before first paint, so a restored compact grid never flashes at
// comfortable density. Hydration then re-renders with the same value this already applied.
export const BROWSE_DENSITY_RESTORE_SCRIPT = `(function(){try{var e=document.currentScript.parentElement;if(sessionStorage.getItem(${JSON.stringify(BROWSE_DENSITY_KEY)})==="compact")e.dataset.density="compact"}catch(t){}})()`;
