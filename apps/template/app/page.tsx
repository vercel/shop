import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ProductsGrid } from "@/components/product/products-grid";
import { BannerSection } from "@/components/sections/banner-section";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { siteConfig } from "@/lib/config";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  const title = t("homeTitle");
  const description = t("homeDescription");

  return {
    title: `${title} | ${siteConfig.name}`,
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
  const [locale, t] = await Promise.all([getLocale(), getTranslations("home")]);

  return (
    <Page className="pt-0">
      <Sections>
        <BannerSection
          hero={{
            id: "homepage-hero",
            headline: t("headline"),
            subheadline: t("subheadline"),
            ctaText: t("ctaText"),
            ctaLink: "/collections/all",
          }}
        />

        <Container>
          <ProductsGrid
            title={t("productsTitle")}
            limit={8}
            locale={locale}
            collectionUrl="/collections/all"
          />
        </Container>
      </Sections>
    </Page>
  );
}
