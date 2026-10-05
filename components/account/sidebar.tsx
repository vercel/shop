import { ACCOUNT_LINKS } from "./links";
import { SidebarClient } from "./sidebar-client";

export function AccountSidebar() {
  return <SidebarClient links={ACCOUNT_LINKS} />;
}
