"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { label: "Shop", href: "/search" },
  { label: "About", href: "/about" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="md:hidden -ml-2 p-2" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-0">
        <div className="px-5 pt-5">
          <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
        </div>
        <nav className="flex flex-col px-2.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2.5 py-2.5 text-lg font-medium transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
