import { isAuthConfigured } from "@/lib/auth/auth";

import { NavAccountClient } from "./account-client";

export function NavAccount() {
  if (!isAuthConfigured) return null;

  return <NavAccountClient />;
}
