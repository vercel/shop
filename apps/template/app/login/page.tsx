"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { signIn } from "@/lib/auth/client";

export default function LoginPage() {
  const t = useTranslations("common");

  useEffect(() => {
    signIn("/account");
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">{t("loginRedirecting")}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("loginNotRedirected")}{" "}
          <button type="button" onClick={() => signIn("/account")} className="underline">
            {t("loginClickHere")}
          </button>
        </p>
      </div>
    </div>
  );
}
