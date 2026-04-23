import { getCustomerSession } from "@/lib/auth/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { UserRoundCheckIcon, UserRoundIcon } from "lucide-react";

export async function NavAccount() {
  const [session, t] = await Promise.all([getCustomerSession(), getTranslations("nav")]);

  if (!session) {
    return (
      <Link
        href="/login"
        className="flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
      >
        <UserRoundIcon className="size-5" />
        <span className="sr-only">{t("signIn")}</span>
      </Link>
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
    <div className="flex items-center justify-center text-foreground">
      <UserRoundIcon className="size-5" />
    </div>
  );
}
