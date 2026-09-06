import { SidebarClient } from "./sidebar-client";

export function AccountSidebar() {
  return (
    <SidebarClient
      links={[
        { href: "/account/profile", label: "Profile" },
        { href: "/account/orders", label: "Orders" },
        { href: "/account/addresses", label: "Addresses" },
      ]}
    />
  );
}
