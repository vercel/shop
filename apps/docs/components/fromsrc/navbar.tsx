"use client";

import { useChatState } from "@/lib/chatstate";
import { SiVercel } from "@icons-pack/react-simple-icons";
import { MenuIcon, MessagesSquareIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { nav } from "@/lib/constants";
import { SlashIcon } from "./icons";

interface NavItem {
  title: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Navbar({ navigation }: { navigation?: NavSection[] }) {
  const pathname = usePathname();
  const isDocs = pathname.startsWith("/docs");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { isOpen: chatOpen, setIsOpen: setChatOpen } = useChatState();

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="h-16" />
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-sidebar [backface-visibility:hidden]">
        <div className="mx-auto flex h-full w-full items-center gap-2 px-4 md:gap-4 md:px-6">
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <a href="https://vercel.com/" rel="noopener" target="_blank">
              <SiVercel className="size-5" />
            </a>
            <SlashIcon className="size-5 text-border" />
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <nav className="ml-4 hidden md:flex items-center gap-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors hover:text-foreground ${
                  pathname === item.href || (item.href === "/docs" && isDocs)
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
                {...(item.target ? { target: item.target, rel: "noopener" } : {})}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-0.5 md:gap-1">
            {isDocs && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "k", metaKey: true }));
                  }}
                  className="hidden md:flex items-center justify-between gap-8 h-8 px-3 pr-1.5 rounded-md border bg-background text-sm font-normal text-muted-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 transition-colors"
                >
                  <span>Search...</span>
                  <kbd className="pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-sm border bg-background px-1 font-sans text-xs font-medium select-none text-muted-foreground">⌘K</kbd>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setChatOpen((prev) => !prev)}
              className="shrink-0 flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-md border bg-background text-sm text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 transition-colors"
            >
              <MessagesSquareIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
            {isDocs && navigation && (
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                aria-label="Open menu"
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MenuIcon className="size-5" aria-hidden="true" />
              </button>
            )}
            {!isDocs && (
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                aria-label="Open menu"
                className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MenuIcon className="size-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </header>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="gap-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Site navigation</SheetDescription>
          </SheetHeader>

          <div className="px-4 pt-14 pb-3">
            {isDocs && (
              <button
                type="button"
                className="h-9 w-full flex items-center rounded-lg border border-border bg-muted/30 px-3 gap-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSheetOpen(false);
                  setTimeout(() => {
                    window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "k", metaKey: true }));
                  }, 200);
                }}
              >
                <SearchIcon className="size-4 shrink-0" aria-hidden="true" />
                Search...
                <kbd className="ml-auto text-xs font-mono text-muted-foreground/50">⌘K</kbd>
              </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto px-4 pb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <div className="mb-4">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={`block py-1.5 text-sm transition-colors ${
                    pathname === item.href || (item.href === "/docs" && isDocs)
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  {...(item.target ? { target: item.target, rel: "noopener" } : {})}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {navigation?.map((section) => (
              <div key={section.title} className="mt-4 first:mt-0">
                {section.title && (
                  <p className="flex items-center gap-2 mb-2 font-medium text-sm text-foreground">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={`block w-full truncate text-pretty py-1.5 text-sm transition-colors ${
                      pathname === item.href
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
