import { UserRoundCheckIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";

import { getCustomerSession } from "@/lib/auth/server";
import { t } from "@/lib/i18n/server";

export async function NavAccount() {
  const [session, signInLabel, accountLabel] = await Promise.all([
    getCustomerSession(),
    t("nav.signIn"),
    t("nav.account"),
  ]);

  if (!session) {
    return (
      <Link
        href="/account/login"
        className="flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
      >
        <UserRoundIcon className="size-5" />
        <span className="sr-only">{signInLabel}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
    >
      <UserRoundCheckIcon className="size-5" />
      <span className="sr-only">{accountLabel}</span>
    </Link>
  );
}

export function NavAccountFallback() {
  return (
    <span className="flex items-center justify-center text-foreground">
      <UserRoundIcon className="size-5" />
    </span>
  );
}
