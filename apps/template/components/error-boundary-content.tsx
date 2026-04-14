"use client";

import { AlertCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ShopLink as Link } from "@/components/ui/shop-link";

export function ErrorBoundaryContent({ reset }: { reset: () => void }) {
  const t = useTranslations("common");

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center lg:py-24">
      <div className="mb-6 flex justify-center">
        <div className="rounded-full bg-muted p-4">
          <AlertCircleIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      <h1 className="mb-2 text-2xl font-medium lg:text-3xl">{t("error")}</h1>
      <p className="mb-8 max-w-md text-muted-foreground">{t("errorDesc")}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>{t("tryAgain")}</Button>
        <Button variant="outline" asChild>
          <Link href="/">{t("goHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
