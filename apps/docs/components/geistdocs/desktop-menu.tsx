"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArrowUpRightSmall } from "@/components/geistcn-fallbacks/geistcn-assets/icons/icon-arrow-up-right-small";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DesktopMenuProps {
  className?: string;
  items: { label: string; href: string; target?: string }[];
}

export const DesktopMenu = ({ items, className }: DesktopMenuProps) => {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  return (
    <NavigationMenu viewport={isMobile}>
      <NavigationMenuList className={cn("h-14 gap-4", className)}>
        {items.map((item) => {
          const external = item.href.startsWith("http") || item.target === "_blank";
          const isActive =
            !external && (pathname === item.href || (item.href === "/docs" && pathname.startsWith("/docs")));
          return (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink
                asChild
                className={cn(
                  "flex items-center text-sm transition-colors duration-100",
                  isActive ? "text-gray-1000" : "text-gray-900 hover:text-gray-1000"
                )}
              >
                {external ? (
                  <a
                    className="flex flex-row items-center gap-1"
                    href={item.href}
                    rel="noopener"
                    target="_blank"
                  >
                    {item.label}
                    <IconArrowUpRightSmall aria-hidden="true" size={12} />
                  </a>
                ) : (
                  <Link href={item.href}>{item.label}</Link>
                )}
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
};
