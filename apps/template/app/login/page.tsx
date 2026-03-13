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
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-lg">{t("loginRedirecting")}</div>
        <div className="text-sm text-muted-foreground">
          {t("loginNotRedirected")}{" "}
          <button
            type="button"
            onClick={() => signIn("/account")}
            className="underline hover:text-foreground"
          >
            {t("loginClickHere")}
          </button>
        </div>
      </div>
    </div>
  );
}
