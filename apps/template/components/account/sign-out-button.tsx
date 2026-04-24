"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";

export function SignOutButton() {
  const t = useTranslations("account");

  return (
    <Button variant="outline" size="sm" onClick={() => signOut()}>
      {t("signOut")}
    </Button>
  );
}
