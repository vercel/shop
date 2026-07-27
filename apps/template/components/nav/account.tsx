import { UserRoundCheckIcon, UserRoundIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { isCustomerLoggedIn } from "@/lib/auth/server";

export async function NavAccount() {
  const [loggedIn, t] = await Promise.all([isCustomerLoggedIn(), getTranslations("nav")]);

  if (!loggedIn) {
    // Sign-in must be a full document navigation; the proxy auth route issues an OAuth redirect and must never be prefetched.
    return (
      // eslint-disable-next-line next/no-html-link-for-pages
      <a
        href="/account/login"
        className="flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
      >
        <UserRoundIcon className="size-5" />
        <span className="sr-only">{t("signIn")}</span>
      </a>
    );
  }

  return (
    <Link
      href="/account"
      className="flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
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
