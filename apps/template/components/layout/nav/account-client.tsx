"use client";

import { UserRoundCheckIcon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { useSession } from "@/lib/auth/client";

export function NavAccountClient() {
  const { authenticated } = useSession();
  const t = useTranslations("nav");

  return (
    <Link
      href={authenticated ? "/account" : "/account/login"}
      className="flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
    >
      {authenticated ? (
        <UserRoundCheckIcon className="size-5" />
      ) : (
        <UserRoundIcon className="size-5" />
      )}
      <span className="sr-only">{authenticated ? t("account") : t("signIn")}</span>
    </Link>
  );
}
