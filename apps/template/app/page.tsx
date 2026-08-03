import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { HomeHero } from "@/components/home/hero";
import { HomeLayers } from "@/components/home/home-layers";
import { Page } from "@/components/ui/page";
import { shopConfig } from "@/lib/config";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  const title = t("homeTitle");
  const description = t("homeDescription");

  return {
    title: `${title} | ${shopConfig.site.name}`,
    description,
    alternates: buildAlternates({ pathname: "/" }),
    openGraph: buildOpenGraph({
      title,
      description,
      url: "/",
      type: "website",
    }),
  };
}

export default async function HomePage() {
  const locale = await getLocale();

  return (
    <Page className="pt-0">
      <HomeHero />
      <HomeLayers locale={locale} />
    </Page>
  );
}
