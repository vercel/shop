import { UserRoundCheckIcon, UserRoundIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { getCustomerSession } from "@/lib/auth/server";

export async function NavAccount() {
  const [session, t] = await Promise.all([getCustomerSession(), getTranslations("nav")]);

  if (!session) {
    return (
      <Link
        href="/account/login"
        className="absolute inset-0 flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
      >
        <UserRoundIcon className="size-5" />
        <span className="sr-only">{t("signIn")}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="absolute inset-0 flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
    >
      <UserRoundCheckIcon className="size-5" />
      <span className="sr-only">{t("account")}</span>
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
