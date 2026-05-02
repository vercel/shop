"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const COMING_SOON_HREFS = new Set([
  "/docs/skills/enable-content-summarization",
  "/docs/skills/enable-virtual-try-on",
]);

export function DocsSidebar({ navigation }: { navigation: NavSection[] }) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="docs sidebar"
      className="hidden w-72 shrink-0 lg:block"
    >
      <div className="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto px-4 py-6">
        <nav className="flex flex-col gap-6">
          {navigation.map((section) => (
            <div key={section.title || "_root"} className="flex flex-col gap-1">
              {section.title && (
                <p className="px-2 pb-1 font-medium text-sm text-gray-1000">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const active = pathname === item.href;
                const comingSoon = COMING_SOON_HREFS.has(item.href);
                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:text-gray-1000",
                      active ? "text-gray-1000" : "text-gray-800"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <span className="min-w-0 truncate">{item.title}</span>
                    {comingSoon && (
                      <Badge className="ml-auto rounded-full" variant="secondary">
                        Coming soon
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
