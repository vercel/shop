"use client";

import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCart } from "@/components/cart/context";

export function CartWarnings() {
  const { clearWarnings, lastWarnings } = useCart();
  const t = useTranslations("cart");

  if (lastWarnings.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="grid flex-1 gap-1">
          <p className="font-medium">{t("warningsTitle")}</p>
          <ul className="grid gap-0.5 text-amber-800 dark:text-amber-200/90">
            {lastWarnings.map((warning) => (
              <li key={`${warning.code}:${warning.target}`}>{warning.message}</li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={clearWarnings}
          aria-label={t("dismissWarnings")}
          className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/40"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
