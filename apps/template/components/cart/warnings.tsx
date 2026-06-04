"use client";

import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCart } from "@/components/cart/context";

export function CartWarnings() {
  const { lastWarnings, clearWarnings } = useCart();
  const t = useTranslations("cart");

  if (lastWarnings.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 rounded-md px-3 py-2.5 text-sm text-amber-900 dark:text-amber-100"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="flex-1 grid gap-1">
          <p className="font-medium">{t("warningsTitle")}</p>
          <ul className="grid gap-0.5 text-amber-800 dark:text-amber-200/90">
            {lastWarnings.map((w) => (
              <li key={`${w.code}:${w.target}`}>{w.message}</li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={clearWarnings}
          aria-label={t("dismissWarnings")}
          className="shrink-0 size-6 inline-flex items-center justify-center rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
