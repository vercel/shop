import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FeaturedProducts } from "@/components/product/products-grid";
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

// Placeholder homepage; copy is inline so the file can be replaced wholesale.
export default async function HomePage() {
  const locale = await getLocale();

  return (
    <Page className="pt-0">
      <Sections>
        <BannerSection
          hero={{
            id: "homepage-hero",
            headline: "Agentic Infrastructure for Commerce",
            subheadline: "A production-ready, agent-friendly Shopify storefront built on Next.js.",
            ctaText: "Browse the Catalog",
            ctaLink: "/search",
          }}
        />

        <Container>
          <FeaturedProducts
            title="Featured Products"
            limit={8}
            locale={locale}
            collectionUrl="/search"
          />
        </Container>
      </Sections>
    </Page>
  );
}
