"use client";

import { XIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { RemoveScroll } from "react-remove-scroll";
import { Button } from "@/components/ui/button";
import type { MegamenuItem } from "@/lib/shopify/types/megamenu";
import { MegamenuPanel } from "./megamenu-panel";
import { MenuTriggerIcon } from "./menu-trigger-icon";
import { MouseSafeArea } from "./mouse-safe-area";

type Props = {
  items: MegamenuItem[];
  children?: React.ReactNode;
};

type MegamenuTopLevelTriggerProps = {
  item: MegamenuItem;
  isActive: boolean;
  label: string;
  onClose: () => void;
  onHover: (id: string) => void;
  onFocus: (id: string) => void;
};

const TRIGGER_CLASS =
  "relative block py-0.5 text-3xl font-medium leading-[1.1] tracking-tight transition-colors text-muted-foreground/70 hover:text-foreground data-[active=true]:text-foreground data-[active=true]:after:absolute data-[active=true]:after:-left-3 data-[active=true]:after:top-1/2 data-[active=true]:after:h-2 data-[active=true]:after:w-2 data-[active=true]:after:-translate-y-1/2 data-[active=true]:after:rounded-full data-[active=true]:after:bg-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm";

function MegamenuTopLevelTrigger({
  item,
  isActive,
  label,
  onClose,
  onHover,
  onFocus,
}: MegamenuTopLevelTriggerProps) {
  if (item.href) {
    const isExternal = item.href.startsWith("http");

    if (isExternal) {
      return (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          onMouseEnter={() => onHover(item.id)}
          onFocus={() => onFocus(item.id)}
          className={TRIGGER_CLASS}
          data-active={isActive ? "true" : "false"}
        >
          {label}
        </a>
      );
    }

    return (
      <Link
        href={item.href}
        onClick={onClose}
        onMouseEnter={() => onHover(item.id)}
        onFocus={() => onFocus(item.id)}
        className={TRIGGER_CLASS}
        data-active={isActive ? "true" : "false"}
      >
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onMouseEnter={() => onHover(item.id)}
      onFocus={() => onFocus(item.id)}
      onClick={() => onFocus(item.id)}
      className={TRIGGER_CLASS}
      data-active={isActive ? "true" : "false"}
    >
      {label}
    </button>
  );
}

export function MegamenuClient({ items, children }: Props) {
  const t = useTranslations("nav");
  const categoriesLabel = t("categories");
  const firstId = items[0]?.id ?? "";
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState(firstId);

  const hoverTimerRef = useRef<number | null>(null);
  const directionRef = useRef<"right" | "other">("other");
  const lastMouseXRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const onBroadcast = useEffectEvent((channel: BroadcastChannel) => {
    channel.onmessage = (ev) => {
      const { type } = ev.data;
      if (type === "open") setIsOpen(true);
      else if (type === "close") setIsOpen(false);
      else if (type === "toggle") setIsOpen((prev) => !prev);
    };
  });

  useEffect(() => {
    const channel = new BroadcastChannel("megamenu");
    onBroadcast(channel);
    return () => channel.close();
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setActiveId(firstId);
  }, [firstId]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleNavMouseMove = useCallback((e: React.MouseEvent) => {
    const deltaX = e.clientX - lastMouseXRef.current;
    lastMouseXRef.current = e.clientX;
    directionRef.current = deltaX > 2 ? "right" : "other";
  }, []);

  const setActiveWithIntent = useCallback((id: string) => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);

    if (directionRef.current === "right") {
      // Moving toward the panel — delay to avoid accidental switch
      hoverTimerRef.current = window.setTimeout(() => {
        setActiveId(id);
      }, 150);
      return;
    }

    // Moving vertically or away from panel — switch immediately
    setActiveId(id);
  }, []);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? items[0],
    [items, activeId],
  );
  const hasPanels = useMemo(
    () => items.some((item) => item.panels.length > 0),
    [items],
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setActiveId(firstId);
  }, [firstId]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 -ml-3 text-base font-semibold translate-y-px"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {isOpen ? (
          <XIcon className="h-4 w-4" />
        ) : (
          <MenuTriggerIcon className="h-4 w-4" />
        )}
        <span>{categoriesLabel}</span>
      </Button>

      {isOpen ? (
        <RemoveScroll>
          <div className="pointer-events-none fixed inset-x-0 top-0 h-dvh z-50 transition-opacity duration-200 visible opacity-100">
            <div
              className="pointer-events-auto absolute inset-x-0 top-[var(--header-height)] bottom-0"
              onClick={handleClose}
              aria-hidden="true"
            />

            <div
              className="pointer-events-auto absolute inset-x-0 top-[var(--header-height)] bottom-0 bg-background/90 backdrop-blur-md shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-label="Mega menu"
              onMouseLeave={() => {
                if (hoverTimerRef.current) {
                  window.clearTimeout(hoverTimerRef.current);
                }
                setActiveId(firstId);
              }}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/35" />

              <div className="relative h-full px-4 lg:px-8 pt-6 pb-8">
                <div
                  className={
                    hasPanels
                      ? "grid h-full grid-cols-[max-content_1fr] gap-x-16"
                      : "grid h-full grid-cols-1"
                  }
                >
                  <div className="flex h-full min-h-0 min-w-0 flex-col">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t("exploreCategories")}
                    </h3>

                    <nav
                      aria-label="Categories"
                      className="mt-3 flex-1 min-h-0 overflow-hidden"
                      onMouseMove={handleNavMouseMove}
                    >
                      <ul className="h-full w-full space-y-2 overflow-y-auto overscroll-contain pr-4 pt-1 pb-6 [scrollbar-gutter:stable]">
                        {items.map((item) => (
                          <li key={item.id}>
                            <MegamenuTopLevelTrigger
                              item={item}
                              isActive={hasPanels && item.id === activeItem?.id}
                              label={item.label || categoriesLabel}
                              onClose={handleClose}
                              onHover={setActiveWithIntent}
                              onFocus={setActiveId}
                            />
                          </li>
                        ))}
                      </ul>
                    </nav>

                    {children ? (
                      <div className="shrink-0 border-t border-border/40 pt-4 mt-4 flex items-center gap-4">
                        {children}
                      </div>
                    ) : null}
                  </div>

                  {hasPanels ? (
                    <div
                      ref={panelRef}
                      className="relative flex h-full min-w-0 flex-col"
                    >
                      <MouseSafeArea parentRef={panelRef} />
                      <div className="h-[20px]" aria-hidden />

                      <div className="flex-1 min-h-0 overflow-y-auto pr-4 [scrollbar-gutter:stable]">
                        <div className="max-w-[720px]">
                          <div className="flex flex-col gap-16">
                            {(activeItem?.panels ?? []).map((panel) => (
                              <MegamenuPanel
                                key={panel.id}
                                panel={panel}
                                fallbackHeader={categoriesLabel}
                                onLinkClick={handleClose}
                              />
                            ))}

                            {activeItem?.href ? (
                              <div>
                                {activeItem.href.startsWith("http") ? (
                                  <a
                                    href={activeItem.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleClose}
                                    className="text-sm font-medium text-foreground hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm"
                                  >
                                    {t("showAllCategory", {
                                      category:
                                        activeItem.label || categoriesLabel,
                                    })}
                                  </a>
                                ) : (
                                  <Link
                                    href={activeItem.href}
                                    onClick={handleClose}
                                    className="text-sm font-medium text-foreground hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-sm"
                                  >
                                    {t("showAllCategory", {
                                      category:
                                        activeItem.label || categoriesLabel,
                                    })}
                                  </Link>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
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

export function MegamenuFallback() {
  const t = useTranslations("nav");

  return (
    <div className="flex items-center gap-2 text-sm font-medium opacity-50">
      <MenuTriggerIcon className="h-4 w-4" />
      <span>{t("categories")}</span>
    </div>
  );
}
