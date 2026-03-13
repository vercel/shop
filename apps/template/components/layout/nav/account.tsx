import { UserIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCustomerSession } from "@/lib/auth/server";
import { AccountClient } from "./account-client";

export async function NavAccount() {
  const [session, t] = await Promise.all([
    getCustomerSession(),
    getTranslations("nav"),
  ]);

  if (!session) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-3 py-2 hover:opacity-70 focus-visible:opacity-70 transition-opacity outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:rounded-full"
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <UserIcon className="w-4 h-4" />
        </div>
        <div className="hidden lg:flex flex-col leading-tight w-18">
          <span className="text-xs font-semibold text-foreground">
            {t("account")}
          </span>
          <span className="text-xs text-muted-foreground">{t("signIn")}</span>
        </div>
      </Link>
    );
  }

  return (
    <AccountClient
      email={session.email}
      translations={{
        account: t("account"),
        profile: t("profile"),
        orders: t("orders"),
        signOut: t("signOut"),
      }}
    />
  );
}
