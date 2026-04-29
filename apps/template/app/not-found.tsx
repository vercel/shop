import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";

export default async function NotFoundError() {
  const t = await getTranslations("common");

  return (
    <Page className="flex flex-1 flex-col">
      <Container className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex flex-col items-center text-center gap-2.5">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            {t("notFound")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl">{t("notFoundDesc")}</p>
          <Link
            href="/search"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg text-sm font-medium bg-link text-link-foreground hover:bg-link/90 transition-colors"
          >
            {t("continueShopping")}
          </Link>
        </div>
      </Container>
    </Page>
  );
}
