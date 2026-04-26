import { tNamespace } from "@/lib/i18n/server";

import { SidebarClient } from "./sidebar-client";

const ACCOUNT_LINKS = [
  { href: "/account/profile", key: "profile" as const },
  { href: "/account/orders", key: "orders" as const },
  { href: "/account/addresses", key: "addresses" as const },
] as const;

export async function AccountSidebar() {
  const labels = await tNamespace("account");

  const links = ACCOUNT_LINKS.map((link) => ({
    href: link.href,
    label: labels[link.key],
  }));

  return <SidebarClient links={links} />;
}
