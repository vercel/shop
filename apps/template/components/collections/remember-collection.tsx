"use client";

import { useEffect, useRef } from "react";

interface RememberCollectionProps {
  handle: string;
}

// Only a real client-side render sets the cookie — prefetches never mount this component,
// so background prefetches can't clobber the remembered collection.
export function RememberCollection({ handle }: RememberCollectionProps) {
  const last = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (last.current === handle) return;
    last.current = handle;
    document.cookie = `state_v0=${handle}; path=/; max-age=2592000; samesite=lax`;
  }, [handle]);

  return null;
}
