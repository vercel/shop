"use client";

import { useCart } from "@shopify/hydrogen/react";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISS_AFTER_MS = 5000;

export function CartNotifications() {
  const errorAt = useCart((state) =>
    state.errors.network.length > 0 ? state.errors.networkUpdatedAt : null,
  );
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  useEffect(() => {
    if (errorAt === null) return;
    const timeout = setTimeout(() => setDismissedAt(errorAt), DISMISS_AFTER_MS);
    return () => clearTimeout(timeout);
  }, [errorAt]);

  if (errorAt === null || dismissedAt === errorAt) return null;

  return (
    <div
      className="fixed right-5 bottom-20 z-50 flex max-w-sm items-center gap-2.5 rounded-lg border border-destructive/20 bg-background px-4 py-2.5 text-sm text-destructive shadow-lg"
      role="alert"
    >
      <span>We couldn&apos;t update your cart. Please try again.</span>
      <button
        aria-label="Dismiss"
        className="flex cursor-pointer items-center text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setDismissedAt(errorAt)}
        type="button"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
