"use client";

import { useTranslations } from "next-intl";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface AboutItemProps extends ComponentPropsWithoutRef<"div"> {
  descriptionHtml: string;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function getDescriptionBlocks(descriptionHtml: string): string[] {
  return descriptionHtml
    .replace(/<li\b[^>]*>/gi, "\n• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(article|div|h[1-6]|ol|p|section|ul)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .split(/\n{2,}/)
    .map((block) =>
      decodeHtmlEntities(block)
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
    )
    .filter(Boolean);
}

export function AboutItem({
  descriptionHtml,
  className,
  ...props
}: AboutItemProps) {
  const t = useTranslations("product");
  const descriptionBlocks = getDescriptionBlocks(descriptionHtml);

  if (descriptionBlocks.length === 0) return null;

  const seenBlocks = new Map<string, number>();

  return (
    <div className={cn("space-y-3", className)} {...props}>
      <h3 className="text-base font-semibold text-foreground tracking-tight">
        {t("aboutThisItem")}
      </h3>
      <div className="space-y-2 text-sm font-normal leading-relaxed text-foreground">
        {descriptionBlocks.map((block) => {
          const occurrence = seenBlocks.get(block) ?? 0;
          seenBlocks.set(block, occurrence + 1);

          return (
            <p key={`${block}-${occurrence}`} className="whitespace-pre-line">
              {block}
            </p>
          );
        })}
      </div>
    </div>
  );
}
