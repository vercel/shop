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
        className="flex items-center justify-center text-link hover:opacity-70 transition-opacity"
      >
        <UserRoundIcon className="size-5" />
        <span className="sr-only">{t("signIn")}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="flex items-center justify-center text-link hover:opacity-70 transition-opacity"
    >
      <UserRoundCheckIcon className="size-5" />
      <span className="sr-only">{t("account")}</span>
    </Link>
  );
}

export function NavAccountFallback() {
  return (
    <span className="flex items-center justify-center text-link">
      <UserRoundIcon className="size-5" />
    </span>
  );
}
