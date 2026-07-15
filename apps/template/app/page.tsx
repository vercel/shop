import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ProductsGrid } from "@/components/product/products-grid";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { shopConfig } from "@/shop.config";

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
  const [locale, t] = await Promise.all([getLocale(), getTranslations("home")]);

  return (
    <Page className="pt-0">
      <Sections>
        <section className="grid">
          <div className="col-start-1 row-start-1 hidden md:block md:aspect-[3/1]" />
          <div className="relative col-start-1 row-start-1 flex items-center justify-center px-5 py-10 lg:px-10">
            <div className="flex flex-col items-center text-center gap-2.5">
              <h1 className="text-3xl md:text-5xl max-w-3xl text-foreground">{t("headline")}</h1>
              <p className="text-sm md:text-base max-w-xl text-foreground">{t("subheadline")}</p>
            </div>
          </div>
        </section>

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
