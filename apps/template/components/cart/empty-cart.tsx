"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function Empty() {
  const t = useTranslations("cart");

  return (
    <div className="flex flex-col items-center justify-center py-16 lg:py-24 px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <ShoppingBagIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <h2 className="text-2xl lg:text-3xl font-medium mb-2">{t("empty")}</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t("emptyDescription")}</p>

        <Link
          href="/"
          className="inline-block px-8 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          {t("continueShopping")}
        </Link>
      </div>
    </div>
  );
}
