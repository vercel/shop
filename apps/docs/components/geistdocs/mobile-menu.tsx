"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconArrowUpRight } from "@/components/geistcn-fallbacks/geistcn-assets/icons/icon-arrow-up-right";
import { nav } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SearchButton } from "./search-button";

interface NavItem {
  title: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function NavLink({
  href,
  external,
  active,
  onClick,
  children,
}: {
  href: string;
  external?: boolean;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      className={cn(
        "group flex items-center justify-between rounded-md p-3 transition-colors hover:bg-accent",
        active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
      )}
      href={href}
      onClick={onClick}
      rel={external ? "noopener" : undefined}
      target={external ? "_blank" : undefined}
    >
      {children}
      {external && (
        <IconArrowUpRight
          className="text-muted-foreground group-hover:text-foreground"
          size={16}
        />
      )}
    </Link>
  );
}

function MobileMenuButton({
  expanded,
  onClick,
}: {
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-expanded={expanded}
      aria-label={expanded ? "Close menu" : "Open menu"}
      className="relative flex size-8 items-center justify-center rounded-full border transition-colors hover:bg-accent lg:hidden"
      onClick={onClick}
      type="button"
    >
      <span className="flex flex-col items-center justify-center gap-[5px]">
        <span
          className={cn(
            "block h-[1.5px] w-3.5 bg-foreground transition-all duration-150",
            expanded && "translate-y-[3.25px] rotate-45"
          )}
        />
        <span
          className={cn(
            "block h-[1.5px] w-3.5 bg-foreground transition-all duration-150",
            expanded && "-translate-y-[3.25px] -rotate-45"
          )}
        />
      </span>
    </button>
  );
}

export const MobileMenu = ({ navigation }: { navigation?: NavSection[] }) => {
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  const isDocs = pathname.startsWith("/docs");

  // Close on route change
  useEffect(() => {
    setShow(false);
  }, [pathname]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && show) {
        setShow(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [show]);

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  const close = () => setShow(false);

  return (
    <>
      <MobileMenuButton expanded={show} onClick={() => setShow(!show)} />

      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: backdrop dismiss */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-40 bg-background backdrop-blur-sm transition-opacity duration-200",
          show
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={close}
      />

      <div
        className={cn(
          "fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-background px-2 transition-all duration-200",
          show
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        )}
      >
        <div className="p-4">
          <SearchButton className="w-full" onClick={close} />
        </div>

        <nav className="px-1">
          {nav.map(({ label, href, target }) => {
            const external = href.startsWith("http") || target === "_blank";
            const active =
              !external && (pathname === href || (href === "/docs" && isDocs));
            return (
              <NavLink
                active={active}
                external={external}
                href={href}
                key={href}
                onClick={close}
              >
                {label}
              </NavLink>
            );
          })}
        </nav>

        {isDocs && navigation && navigation.length > 0 && (
          <nav className="px-1 pt-2 pb-6">
            {navigation.map((section) => (
              <div key={section.title || "_root"} className="mt-4 first:mt-0">
                {section.title && (
                  <p className="flex items-center gap-2 mb-1 px-3 font-medium text-sm text-foreground">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => (
                  <NavLink
                    active={pathname === item.href}
                    href={item.href}
                    key={item.href}
                    onClick={close}
                  >
                    <span className="truncate">{item.title}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        )}
      </div>
    </>
  );
};
