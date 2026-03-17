"use client";

import Link from "next/link";

import type { MegamenuPanel as MegamenuPanelType } from "@/lib/shopify/types/megamenu";

type Props = {
  panel: MegamenuPanelType;
  fallbackHeader: string;
  onLinkClick?: () => void;
};

export function MegamenuPanel({ panel, fallbackHeader, onLinkClick }: Props) {
  return (
    <section className="min-w-0 space-y-5">
      {panel.href ? (
        <h4>
          {panel.href.startsWith("http") ? (
            <a
              href={panel.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm"
            >
              {panel.header || fallbackHeader}
            </a>
          ) : (
            <Link
              href={panel.href}
              onClick={onLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm"
            >
              {panel.header || fallbackHeader}
            </Link>
          )}
        </h4>
      ) : (
        <h4 className="text-sm font-medium text-muted-foreground">
          {panel.header || fallbackHeader}
        </h4>
      )}
      <ul className="space-y-3">
        {panel.categories.map((category) => {
          const isExternal = category.href.startsWith("http");

          return (
            <li key={category.href}>
              {isExternal ? (
                <a
                  href={category.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onLinkClick}
                  className="block truncate text-base font-medium text-foreground transition-colors hover:text-foreground/80 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm"
                >
                  {category.title}
                </a>
              ) : (
                <Link
                  href={category.href}
                  onClick={onLinkClick}
                  className="block truncate text-base font-medium text-foreground transition-colors hover:text-foreground/80 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm"
                >
                  {category.title}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
