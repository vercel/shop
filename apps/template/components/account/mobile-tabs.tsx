import { MobileTabsClient } from "./mobile-tabs-client";

export function AccountMobileTabs() {
  return (
    <MobileTabsClient
      tabs={[
        { href: "/account/profile", label: "Profile" },
        { href: "/account/orders", label: "Orders" },
        { href: "/account/addresses", label: "Addresses" },
      ]}
    />
  );
}
