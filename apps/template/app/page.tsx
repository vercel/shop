import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { FeaturedProducts } from "@/components/product/products-grid";
import { ProductsSlider } from "@/components/product/products-slider";
import { RelatedProductsSectionSkeleton } from "@/components/product/related-products-section";
import { BannerSection } from "@/components/sections/banner-section";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { siteConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getCatalogProducts } from "@/lib/shopify/operations/products";

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

// Placeholder homepage. Replace this file's contents to swap in your own —
// CMS-driven sections, hand-written marketing, etc. Copy is intentionally
// inline (not in i18n catalogs) so you can rip the whole page out cleanly.
export default async function HomePage() {
  const locale = await getLocale();

  return (
    <Page className="pt-0">
      <Sections>
        <BannerSection
          hero={{
            id: "homepage-hero",
            headline: "The Outdoor Edit",
            subheadline: null,
            backgroundVideo: {
              url: "https://cdn.shopify.com/videos/c/o/v/db1572ad04ae4ecbad692430c6269fcf.mp4",
            },
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

        <BannerSection
          headingLevel="h2"
          hero={{
            id: "homepage-bedroom-sale",
            headline: "The Semi-Annual Bedroom Sale",
            subheadline: null,
            backgroundImage: {
              url: "https://cdn.shopify.com/s/files/1/0968/7236/6467/files/ba52372f-eace-4eca-a867-d92aed5bab5b-color-smoked-ash-oxWB0cyHNJnTlCbm8GGURF572Y8LgF.png?v=1776523451",
              alt: "The Semi-Annual Bedroom Sale",
              width: 1920,
              height: 640,
            },
            ctaText: "Shop the Sale",
            ctaLink: "/collections/bedroom",
          }}
        />

        <Container>
          <Suspense fallback={<RelatedProductsSectionSkeleton title="Shop Bookcases" />}>
            <BookcasesSlider locale={locale} />
          </Suspense>
        </Container>

        <BannerSection
          headingLevel="h2"
          hero={{
            id: "homepage-rugs",
            headline: "Eye-Catching Interior Rugs",
            subheadline: null,
            backgroundImage: {
              url: "https://cdn.shopify.com/s/files/1/0968/7236/6467/files/06d5df4c-347b-4b6b-91d1-c6bbade245ba-2-GOxxEWNRZj0NgqxVk1TPPyAXvdRi0c.png?v=1776523437",
              alt: "Eye-catching interior rugs",
              width: 1920,
              height: 640,
            },
            ctaText: "Shop Rugs",
            ctaLink: "/collections/rugs",
          }}
        />
      </Sections>
    </Page>
  );
}

async function BookcasesSlider({ locale }: { locale: Locale }) {
  const { products } = await getCatalogProducts({ query: "bookcase", limit: 8, locale });
  if (products.length === 0) return null;
  return <ProductsSlider title="Shop Bookcases" products={products} locale={locale} />;
}
