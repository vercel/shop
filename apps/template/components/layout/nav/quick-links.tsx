import { ChevronDown } from "lucide-react";
import Link from "next/link";

import type { MenuItem } from "@/lib/shopify/types/menu";
import { cn } from "@/lib/utils";

const MAX_COLUMNS = 5;

interface MenuLinkProps {
  url: string;
  children: React.ReactNode;
  className?: string;
}

function MenuLink({ url, children, className }: MenuLinkProps) {
  if (url.startsWith("http")) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={url} className={className}>
      {children}
    </Link>
  );
}

export function QuickLinks({ items }: { items: MenuItem[] }) {
  return (
    <ul className="hidden md:flex items-center gap-5">
      {items.map((item) => (
        <NavItem key={item.id} item={item} />
      ))}
    </ul>
  );
}

const TRIGGER_CLASS = "flex items-center gap-1 text-sm hover:opacity-70 transition-opacity";

function NavItem({ item }: { item: MenuItem }) {
  if (item.items.length === 0) {
    return (
      <li className="flex items-center h-16">
        <MenuLink url={item.url} className={TRIGGER_CLASS}>
          {item.title}
        </MenuLink>
      </li>
    );
  }

  const columns = item.items.slice(0, MAX_COLUMNS);

  return (
    <li className="group flex items-center h-16">
      <MenuLink url={item.url} className={TRIGGER_CLASS}>
        {item.title}
        <ChevronDown className="size-3" aria-hidden="true" />
      </MenuLink>
      <div
        className={cn(
          "absolute inset-x-0 top-full z-40",
          "invisible opacity-0",
          "group-hover:visible group-hover:opacity-100",
          "group-focus-within:visible group-focus-within:opacity-100",
          "transition-opacity duration-150",
          "bg-background border-b shadow-md",
        )}
      >
        <div className="px-5 lg:px-10 py-8">
          <div className="grid grid-cols-5 gap-5">
            {columns.map((column) => (
              <div key={column.id}>
                {column.url ? (
                  <MenuLink
                    url={column.url}
                    className="block text-sm font-semibold mb-3 hover:opacity-70 transition-opacity"
                  >
                    {column.title}
                  </MenuLink>
                ) : (
                  <h3 className="text-sm font-semibold mb-3">{column.title}</h3>
                )}
                {column.items.length > 0 && (
                  <ul className="space-y-2">
                    {column.items.map((leaf) => (
                      <li key={leaf.id}>
                        <MenuLink
                          url={leaf.url}
                          className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {leaf.title}
                        </MenuLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}
