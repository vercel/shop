import { tNamespace } from "@/lib/i18n/server";

import { MobileTabsClient } from "./mobile-tabs-client";

const ACCOUNT_TABS = [
  { href: "/account/profile", key: "profile" as const },
  { href: "/account/orders", key: "orders" as const },
  { href: "/account/addresses", key: "addresses" as const },
] as const;

export async function AccountMobileTabs() {
  const labels = await tNamespace("account");

  const tabs = ACCOUNT_TABS.map((tab) => ({
    href: tab.href,
    label: labels[tab.key],
  }));

  return <MobileTabsClient tabs={tabs} />;
}
