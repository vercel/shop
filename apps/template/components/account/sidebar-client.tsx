"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AccountSidebarNavItem, accountNavItems } from "./sidebar";

export function AccountSidebarNavItems() {
  const pathname = usePathname();
  const t = useTranslations("account");

  const isActive = (href: string, matchExact: boolean) => {
    if (matchExact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return accountNavItems.map((item) => (
    <AccountSidebarNavItem
      key={item.labelKey}
      href={item.href}
      icon={<item.icon className="size-4" />}
      isActive={isActive(item.href, item.matchExact)}
    >
      {t(item.labelKey)}
    </AccountSidebarNavItem>
  ));
}
