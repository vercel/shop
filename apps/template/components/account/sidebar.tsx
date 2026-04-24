import { getTranslations } from "next-intl/server";

import { SidebarClient } from "./sidebar-client";

const ACCOUNT_LINKS = [
  { href: "/account/profile", key: "profile" as const },
  { href: "/account/orders", key: "orders" as const },
  { href: "/account/addresses", key: "addresses" as const },
] as const;

export async function AccountSidebar() {
  const t = await getTranslations("account");

  const links = ACCOUNT_LINKS.map((link) => ({
    href: link.href,
    label: t(link.key),
  }));

  return <SidebarClient links={links} />;
}
