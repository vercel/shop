"use client";

import { useEffect } from "react";

interface RememberCollectionProps {
  handle: string;
}

export function RememberCollection({ handle }: RememberCollectionProps) {
  // Effects run on visits (including restored pages), never on prefetches.
  useEffect(() => {
    document.cookie = `state_v0=${encodeURIComponent(handle)}; path=/; max-age=2592000; samesite=lax`;
  }, [handle]);

  return null;
}
