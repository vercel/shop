"use client";

import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react";

interface PickedForYouResult {
  collection: string | undefined;
  content: ReactNode;
}

interface PickedForYouClientProps {
  cookieName: string;
  fallback: ReactNode;
  initial: PickedForYouResult;
  load: () => Promise<PickedForYouResult>;
}

function subscribe(onChange: () => void) {
  window.addEventListener("pageshow", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener("pageshow", onChange);
    window.removeEventListener("focus", onChange);
  };
}

export function PickedForYouClient({
  cookieName,
  fallback,
  initial,
  load,
}: PickedForYouClientProps) {
  const collection = useSyncExternalStore(
    subscribe,
    () =>
      document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(`${cookieName}=`))
        ?.slice(cookieName.length + 1),
    () => initial.collection && encodeURIComponent(initial.collection),
  );
  const [result, setResult] = useState(initial);
  const [error, setError] = useState<Error | null>(null);
  const stale = collection !== (result.collection && encodeURIComponent(result.collection));

  useEffect(() => {
    if (collection === (result.collection && encodeURIComponent(result.collection))) return;
    let active = true;
    load().then(
      (next) => {
        if (active) setResult(next);
      },
      (cause) => {
        if (active) setError(cause instanceof Error ? cause : new Error("Recommendations failed"));
      },
    );
    return () => {
      active = false;
    };
  }, [collection, load, result.collection]);

  if (error) throw error;
  return stale ? fallback : result.content;
}
