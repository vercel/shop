"use client";

import { HandbagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function Empty() {
  const t = useTranslations("cart");

  return (
    <div className="flex flex-col items-center justify-center py-10 lg:py-10 px-5">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-5">
            <HandbagIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <h2 className="text-2xl lg:text-3xl font-medium mb-2">{t("empty")}</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t("emptyDescription")}</p>

        <Link
          href="/"
          className="inline-block px-10 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          {t("continueShopping")}
        </Link>
      </div>
    </div>
  );
}
