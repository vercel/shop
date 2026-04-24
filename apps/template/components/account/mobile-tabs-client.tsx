"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface AccountTab {
  href: string;
  label: string;
}

export function MobileTabsClient({ tabs }: { tabs: AccountTab[] }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b md:hidden">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "flex-1 px-3 py-2.5 text-center text-sm transition-colors",
            pathname.startsWith(tab.href)
              ? "border-b-2 border-foreground font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
