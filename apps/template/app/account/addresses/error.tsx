"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function AddressesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-background px-8 py-16">
        <p className="text-lg font-medium text-foreground">{t("error")}</p>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {t("errorDesc")}
        </p>
        <Button onClick={reset} variant="secondary" className="mt-4">
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}
