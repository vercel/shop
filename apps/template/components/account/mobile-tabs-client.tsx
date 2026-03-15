"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AccountMobileTab, mobileNavItems } from "./mobile-tabs";

export function AccountMobileTabItems() {
  const pathname = usePathname();
  const t = useTranslations("account");

  const isActive = (href: string, matchExact: boolean) => {
    if (matchExact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return mobileNavItems.map((item) => (
    <AccountMobileTab
      key={item.labelKey}
      href={item.href}
      icon={<item.icon className="size-4" />}
      isActive={isActive(item.href, item.matchExact)}
    >
      {t(item.labelKey)}
    </AccountMobileTab>
  ));
}
