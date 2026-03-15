"use client";

import { HistoryIcon, PackageIcon, UserPenIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { cn } from "@/lib/utils";

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
        "text-sm font-medium text-[#010101]",
        "border border-transparent",
        // Active state
        "data-[active=true]:bg-[#e9e9e9]",
        "data-[active=true]:[&_svg]:text-[#2986ff] data-[active=true]:[&_svg]:opacity-100",
        // Inactive state
        "[&_svg]:opacity-30 [&_svg]:text-[#010101]",
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

interface AccountMobileTabsComposedProps extends React.ComponentProps<"nav"> {}

function AccountMobileTabsComposed({
  className,
  ...props
}: AccountMobileTabsComposedProps) {
  const pathname = usePathname();
  const t = useTranslations("account");

  const isActive = (href: string, matchExact: boolean) => {
    if (matchExact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <AccountMobileTabs className={className} {...props}>
      {mobileNavItems.map((item) => (
        <AccountMobileTab
          key={item.labelKey}
          href={item.href}
          icon={<item.icon className="size-4" />}
          isActive={isActive(item.href, item.matchExact)}
        >
          {t(item.labelKey)}
        </AccountMobileTab>
      ))}
    </AccountMobileTabs>
  );
}

export {
  AccountMobileTabs,
  AccountMobileTab,
  AccountMobileTabsComposed,
  mobileNavItems,
};
