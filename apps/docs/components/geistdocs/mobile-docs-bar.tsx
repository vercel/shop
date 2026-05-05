"use client";

import type { Heading } from "fromsrc";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconFileText } from "@/components/assets/icons/icon-file-text";
import { IconMenuAlt } from "@/components/assets/icons/icon-menu-alt";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface MobileDocsBarProps {
  headings?: Heading[];
  navigation?: NavSection[];
}

export const MobileDocsBar = ({ headings, navigation }: MobileDocsBarProps) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  const showToc = headings && headings.length > 0;

  return (
    <>
      <div aria-hidden className="h-[54px] lg:hidden" />
      <div className="fixed top-16 left-0 right-0 z-40 -mt-px flex h-[54px] items-center justify-between border-b bg-background-200 px-6 sm:px-8 lg:hidden">
      <button
        className="flex items-center gap-3 text-base text-gray-1000"
        onClick={() => setMenuOpen(true)}
        type="button"
      >
        <IconMenuAlt size={16} />
        Menu
      </button>

      {showToc && (
        <button
          aria-label="Table of contents"
          className="flex size-8 items-center justify-center rounded-md border border-gray-200 text-gray-900 transition-colors hover:bg-gray-100 hover:text-gray-1000"
          onClick={() => setTocOpen(true)}
          type="button"
        >
          <IconFileText size={16} />
        </button>
      )}

      <Sheet onOpenChange={setMenuOpen} open={menuOpen}>
        <SheetContent className="w-80 gap-0 p-0" side="left">
          <SheetHeader>
            <SheetTitle className="pt-4 px-2 font-sans font-medium text-sm text-gray-1000">
              Documentation
            </SheetTitle>
            <SheetDescription className="sr-only">
              Documentation navigation
            </SheetDescription>
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto px-4 pt-2 pb-6">
            {navigation?.map((section) => (
              <div key={section.title || "_root"} className="mt-4 first:mt-0">
                {section.title && (
                  <p className="mb-1 px-2 font-medium text-sm text-gray-1000">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => (
                  <Link
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm transition-colors hover:text-gray-1000",
                      pathname === item.href
                        ? "text-gray-1000 font-medium"
                        : "text-gray-900",
                    )}
                    href={item.href}
                    key={item.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {showToc && (
        <Sheet onOpenChange={setTocOpen} open={tocOpen}>
          <SheetContent className="w-72 gap-0 p-0" side="right">
            <SheetHeader>
              <SheetTitle className="pt-4 font-sans font-medium text-sm text-gray-1000">
                On this page
              </SheetTitle>
              <SheetDescription className="sr-only">
                Table of contents for the current page.
              </SheetDescription>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
              <ul className="space-y-1">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      className={cn(
                        "block rounded-md py-1.5 text-sm text-gray-900 transition-colors hover:text-gray-1000",
                        heading.level > 2 && "pl-4",
                      )}
                      href={`#${heading.id}`}
                      onClick={() => setTocOpen(false)}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>
      )}
      </div>
    </>
  );
};
