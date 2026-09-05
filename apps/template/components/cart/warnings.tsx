"use client";

import type { CartErrorGroup } from "@shopify/hydrogen";
import { useCart } from "@shopify/hydrogen/react";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface CartWarningsProps {
  lineId?: string;
}

export function CartWarnings({ lineId }: CartWarningsProps) {
  const errors = useCart((state) => state.errors);
  const lines = useCart((state) => state.data.lines.nodes);
  const visibleLineIds = new Set(lines.map((line) => line.id));
  const groups = lineId
    ? [errors.lines.get(lineId)]
    : [
        errors.cart,
        ...Array.from(errors.lines.entries())
          .filter(([id]) => !visibleLineIds.has(id))
          .map(([, group]) => group),
      ];
  const group = {
    userErrors: groups.flatMap((entry) => entry?.userErrors ?? []),
    warnings: groups.flatMap((entry) => entry?.warnings ?? []),
  };
  if (!group.userErrors.length && !group.warnings.length) return null;
  return <CartWarningMessages key={JSON.stringify([lineId, group])} group={group} />;
}

function CartWarningMessages({ group }: { group: CartErrorGroup }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const messages = [...group.userErrors, ...group.warnings];
  return (
    <div
      role={group.userErrors.length ? "alert" : "status"}
      className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        <div className="grid flex-1 gap-1">
          <p className="font-medium">
            {group.userErrors.length ? "We couldn't update your cart" : "Your cart was updated"}
          </p>
          <ul className="grid gap-0.5 text-amber-800 dark:text-amber-200/90">
            {messages.map((message, index) => (
              <li key={`${message.code}:${index}`}>{message.message}</li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/40"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
