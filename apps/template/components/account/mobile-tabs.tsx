import { getTranslations } from "next-intl/server";

import { MobileTabsClient } from "./mobile-tabs-client";

const ACCOUNT_TABS = [
  { href: "/account/profile", key: "profile" as const },
  { href: "/account/orders", key: "orders" as const },
  { href: "/account/addresses", key: "addresses" as const },
] as const;

export async function AccountMobileTabs() {
  const t = await getTranslations("account");

  const tabs = ACCOUNT_TABS.map((tab) => ({
    href: tab.href,
    label: t(tab.key),
  }));

  return <MobileTabsClient tabs={tabs} />;
}
