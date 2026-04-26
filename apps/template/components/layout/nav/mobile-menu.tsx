"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { MenuItem } from "@/lib/shopify/types/menu";

interface MenuLinkProps {
  url: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

function MenuLink({ url, children, className, onClick }: MenuLinkProps) {
  if (url.startsWith("http")) {
    return (
      <a
        href={url}
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
    <Link href={url} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

interface MobileMenuProps {
  items: MenuItem[];
  menuLabel: string;
  showAllTemplate: string;
}

export function MobileMenu({ items, menuLabel, showAllTemplate }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const showAllLabel = (title: string) => showAllTemplate.replace("{category}", title);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="md:hidden -ml-2 p-2" aria-label={menuLabel}>
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-0">
        <div className="flex h-16 items-center px-5">
          <SheetTitle className="text-lg font-semibold">{menuLabel}</SheetTitle>
        </div>
        <nav className="px-5">
          <MobileMenuList items={items} onLinkClick={close} showAllLabel={showAllLabel} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MobileMenuList({
  items,
  onLinkClick,
  showAllLabel,
}: {
  items: MenuItem[];
  onLinkClick: () => void;
  showAllLabel: (title: string) => string;
}) {
  const hasAnyChildren = items.some((item) => item.items.length > 0);

  if (!hasAnyChildren) {
    return (
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.id}>
            <MenuLink
              url={item.url}
              onClick={onLinkClick}
              className="text-base transition-colors hover:text-muted-foreground"
            >
              {item.title}
            </MenuLink>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {items.map((item) =>
        item.items.length > 0 ? (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger className="py-3 text-base">{item.title}</AccordionTrigger>
            <AccordionContent>
              <NestedItems items={item.items} onLinkClick={onLinkClick} />
              {item.url ? (
                <MenuLink
                  url={item.url}
                  onClick={onLinkClick}
                  className="mt-3 block text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showAllLabel(item.title)}
                </MenuLink>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ) : (
          <div key={item.id} className="border-b last:border-b-0">
            <MenuLink
              url={item.url}
              onClick={onLinkClick}
              className="flex py-3 text-base transition-colors hover:text-muted-foreground"
            >
              {item.title}
            </MenuLink>
          </div>
        ),
      )}
    </Accordion>
  );
}

function NestedItems({ items, onLinkClick }: { items: MenuItem[]; onLinkClick: () => void }) {
  return (
    <ul className="flex flex-col gap-3 pl-3">
      {items.map((item) => (
        <li key={item.id} className="space-y-2">
          <MenuLink
            url={item.url}
            onClick={onLinkClick}
            className="block text-sm font-medium hover:opacity-70 transition-opacity"
          >
            {item.title}
          </MenuLink>
          {item.items.length > 0 && (
            <ul className="flex flex-col gap-2 pl-3">
              {item.items.map((leaf) => (
                <li key={leaf.id}>
                  <MenuLink
                    url={leaf.url}
                    onClick={onLinkClick}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {leaf.title}
                  </MenuLink>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
