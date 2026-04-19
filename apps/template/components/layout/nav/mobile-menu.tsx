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
        <div className="flex h-16 items-center px-5">
          <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
        </div>
        <nav className="flex flex-col gap-2.5 px-5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-base transition-colors hover:text-muted-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
