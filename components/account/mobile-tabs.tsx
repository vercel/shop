import { ACCOUNT_LINKS } from "./links";
import { MobileTabsClient } from "./mobile-tabs-client";

export function AccountMobileTabs() {
  return <MobileTabsClient tabs={ACCOUNT_LINKS} />;
}
