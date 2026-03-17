"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import { RemoveScroll } from "react-remove-scroll";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { MegamenuData } from "@/lib/shopify/types/megamenu";
import { cn } from "@/lib/utils";

type MegamenuMobileProps = {
  data: MegamenuData;
  children?: React.ReactNode;
};

const TOP_LEVEL_ITEM_CLASS =
  "relative block w-full py-0.5 text-left text-2xl font-medium leading-[1.1] tracking-tight transition-colors text-muted-foreground/70 hover:text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm";

function MobileLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export function MegamenuMobile({ data, children }: MegamenuMobileProps) {
  const [open, setOpen] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState("");
  const t = useTranslations("nav");
  const categoriesLabel = t("categories");
  const exploreCategoriesLabel = t("exploreCategories");

  const onBroadcast = useEffectEvent((channel: BroadcastChannel) => {
    channel.onmessage = (ev) => {
      const { type } = ev.data;
      if (type === "open") setOpen(true);
      else if (type === "close") setOpen(false);
      else if (type === "toggle") setOpen((prev) => !prev);
    };
  });

  useEffect(() => {
    const channel = new BroadcastChannel("megamenu");
    onBroadcast(channel);
    return () => channel.close();
  }, []);

  useEffect(() => {
    setOpen(false);
    setExpandedItemId("");
  }, []);

  useEffect(() => {
    if (!open) {
      setExpandedItemId("");
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setExpandedItemId("");
        const channel = new BroadcastChannel("megamenu");
        channel.postMessage({ type: "close" });
        channel.close();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleClose() {
    setOpen(false);
    setExpandedItemId("");
    const channel = new BroadcastChannel("megamenu");
    channel.postMessage({ type: "close" });
    channel.close();
  }

  return (
    <>
      {open ? (
        <RemoveScroll>
          <div className="pointer-events-none fixed inset-x-0 top-0 h-dvh z-50 transition-opacity duration-200 visible opacity-100">
            <div
              className="pointer-events-auto absolute inset-x-0 top-[calc(4rem+var(--safe-area-top))] bottom-0"
              onClick={handleClose}
              aria-hidden="true"
            />

            <div
              className="pointer-events-auto absolute inset-x-0 top-[calc(4rem+var(--safe-area-top))] bottom-0 bg-background/90 backdrop-blur-md shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-label="Mega menu"
            >
              <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-transparent via-transparent to-muted/35" />

              <div className="relative h-full px-6 pt-6 pb-24">
                <div className="flex h-full min-h-0 min-w-0 flex-col">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {exploreCategoriesLabel}
                  </h3>

                  <nav aria-label="Categories" className="mt-3 flex-1 min-h-0 overflow-hidden">
                    {data.items.length === 0 ? null : (
                      <ul className="h-full w-full space-y-4 overflow-y-auto overscroll-contain pr-2 pt-1 pb-6 [scrollbar-gutter:stable]">
                        {data.items.map((item) => {
                          const label = item.label || categoriesLabel;
                          const hasSubitems = item.panels.some(
                            (panel) => panel.categories.length > 0,
                          );

                          return (
                            <li key={item.id}>
                              {hasSubitems ? (
                                <Accordion
                                  type="single"
                                  collapsible
                                  value={expandedItemId}
                                  onValueChange={setExpandedItemId}
                                >
                                  <AccordionItem value={item.id} className="border-b-0">
                                    <AccordionTrigger
                                      className={cn(
                                        TOP_LEVEL_ITEM_CLASS,
                                        "flex items-center py-0.5 hover:no-underline data-[state=open]:text-foreground",
                                      )}
                                    >
                                      {label}
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-2 pl-2 pt-4">
                                      {item.panels.map((panel) => (
                                        <div key={panel.id} className="mt-6 first:mt-0">
                                          {panel.header ? (
                                            <h4 className="mb-1">
                                              {panel.href ? (
                                                <MobileLink
                                                  href={panel.href}
                                                  className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm"
                                                  onClick={handleClose}
                                                >
                                                  {panel.header}
                                                </MobileLink>
                                              ) : (
                                                <span className="text-lg font-medium text-muted-foreground">
                                                  {panel.header}
                                                </span>
                                              )}
                                            </h4>
                                          ) : null}
                                          <ul className="space-y-1">
                                            {panel.categories.map((category) => (
                                              <li key={category.href}>
                                                <MobileLink
                                                  href={category.href}
                                                  className="block py-1 text-base hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm"
                                                  onClick={handleClose}
                                                >
                                                  {category.title}
                                                </MobileLink>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      ))}

                                      {item.href ? (
                                        <MobileLink
                                          href={item.href}
                                          className="mt-4 block text-sm font-medium hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm"
                                          onClick={handleClose}
                                        >
                                          {t("showAllCategory", {
                                            category: label,
                                          })}
                                        </MobileLink>
                                      ) : null}
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              ) : item.href ? (
                                <MobileLink
                                  href={item.href}
                                  className={TOP_LEVEL_ITEM_CLASS}
                                  onClick={handleClose}
                                >
                                  {label}
                                </MobileLink>
                              ) : (
                                <span className={TOP_LEVEL_ITEM_CLASS}>{label}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </nav>

                  {children ? (
                    <div className="shrink-0 border-t border-border/40 pt-4 mt-4 flex items-center gap-4">
                      {children}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </RemoveScroll>
      ) : null}
    </>
  );
}

export function MegamenuMobileFallback() {
  return null;
}
