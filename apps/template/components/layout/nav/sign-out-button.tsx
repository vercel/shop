"use client";

import { LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut } from "@/lib/auth/client";

export function SignOutButton() {
  const t = useTranslations("nav");

  return (
    <button
      type="button"
      onClick={() => signOut()}
      className="flex w-full items-center gap-2"
    >
      <LogOutIcon className="w-4 h-4" />
      {t("signOut")}
    </button>
  );
}
