"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface RememberCollectionProps {
  handle: string;
}

// Only a real client-side render sets the cookie — prefetches never mount this component,
// so background prefetches can't clobber the remembered collection. router.refresh() after
// setting it busts the cached home entry so returning home re-reads the cookie.
export function RememberCollection({ handle }: RememberCollectionProps) {
  const router = useRouter();
  const last = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (last.current === handle) return;
    last.current = handle;
    document.cookie = `state_v0=${handle}; path=/; max-age=2592000; samesite=lax`;
    router.refresh();
  }, [handle, router]);

  return null;
}
