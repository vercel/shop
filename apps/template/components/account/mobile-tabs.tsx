import { HistoryIcon, PackageIcon, UserPenIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type * as React from "react";

function AccountMobileTabs({
  className,
  children,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="account-mobile-tabs"
      className={cn(
        "flex overflow-x-auto scrollbar-hide gap-1 md:hidden",
        className,
      )}
      {...props}
    >
      {children}
    </nav>
  );
}

interface AccountMobileTabProps extends React.ComponentProps<typeof Link> {
  icon?: React.ReactNode;
  isActive?: boolean;
}

function AccountMobileTab({
  icon,
  isActive = false,
  className,
  children,
  ...props
}: AccountMobileTabProps) {
  return (
    <Link
      data-slot="account-mobile-tab"
      data-active={isActive ? "true" : undefined}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap",
        "text-sm font-medium text-foreground",
        "border border-transparent",
        // Active state
        "data-[active=true]:bg-muted",
        "data-[active=true]:[&_svg]:text-primary data-[active=true]:[&_svg]:opacity-100",
        // Inactive state
        "[&_svg]:opacity-30 [&_svg]:text-foreground",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </Link>
  );
}

const mobileNavItems = [
  {
    href: "/account/profile",
    labelKey: "profile" as const,
    icon: UserPenIcon,
    matchExact: true,
  },
  {
    href: "/account/orders",
    labelKey: "orders" as const,
    icon: HistoryIcon,
    matchExact: false,
  },
  {
    href: "/account/addresses",
    labelKey: "addresses" as const,
    icon: PackageIcon,
    matchExact: false,
  },
] as const;

export {
  AccountMobileTabs,
  AccountMobileTab,
  mobileNavItems,
};
