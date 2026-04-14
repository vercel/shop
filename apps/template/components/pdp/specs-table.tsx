"use client";

import { useTranslations } from "next-intl";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export interface Spec {
  label: string;
  value: string;
}

interface SpecsTableProps extends ComponentPropsWithoutRef<"div"> {
  specs: Spec[];
  showSeeAll?: boolean;
  onSeeAllClick?: () => void;
}

export function SpecsTable({
  specs,
  showSeeAll = true,
  onSeeAllClick,
  className,
  ...props
}: SpecsTableProps) {
  const t = useTranslations("product");

  if (specs.length === 0) return null;

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="border-b border-border/70 space-y-2 py-1.5">
        {specs.map((spec) => (
          <div key={spec.label} className="flex gap-2">
            <span className="flex-1 text-sm font-semibold text-muted-foreground">{spec.label}</span>
            <span className="flex-1 text-sm font-normal text-muted-foreground">{spec.value}</span>
          </div>
        ))}
      </div>
      {showSeeAll && (
        <button
          type="button"
          onClick={onSeeAllClick}
          className="pt-2 text-sm font-medium text-foreground/50 hover:text-foreground/70 transition-colors"
        >
          {t("seeAllSpecs")}
        </button>
      )}
    </div>
  );
}
