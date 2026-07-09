"use client";

import { useEffect } from "react";

interface RememberCollectionProps {
  handle: string;
}

export function RememberCollection({ handle }: RememberCollectionProps) {
  useEffect(() => {
    document.cookie = `state_v0=${handle}; path=/; max-age=2592000; samesite=lax`;
  }, [handle]);

  return null;
}
