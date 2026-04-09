import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";

async function Copyright() {
  await connection();
  const t = await getTranslations("footer");

  return (
    <p className="text-sm text-muted-foreground">
      {t("copyright", { year: String(new Date().getFullYear()) })}
    </p>
  );
}

export function Footer({ locale }: { locale: string }) {
  return (
    <footer className="bg-muted/30">
      <div className="mx-auto px-4 py-12 lg:px-8">
        <Suspense>
          <Copyright />
        </Suspense>
      </div>
    </footer>
  );
}
