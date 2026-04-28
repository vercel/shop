import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FeaturedProducts } from "@/components/product/products-grid";
import { SearchProductsSlider } from "@/components/product/search-products-slider";
import { BannerSection } from "@/components/sections/banner-section";
import { CollectionCards } from "@/components/sections/collection-cards";
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
    alternates: await buildAlternates({ pathname: "/" }),
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
          as="h1"
          hero={{
            id: "homepage-outdoor",
            headline: "The Outdoor Edit",
            subheadline:
              "Durable, stylish pieces built for backyard parties, patio dinners, and every long evening in between.",
            backgroundImage: {
              url: "https://cdn.shopify.com/s/files/1/0968/7236/6467/files/a60299db-53b9-433c-8ed8-1536b094bdee-1-eZIhPYkLEQmYZi0Wfy4znewVcLR3CP_4483df00-a8e6-409b-ad89-0765b64918d6.png?v=1776523442",
              alt: "Outdoor lifestyle scene",
              width: 1456,
              height: 819,
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
          as="h2"
          hero={{
            id: "homepage-rugs",
            headline: "Eye-catching Interior Rugs",
            subheadline: null,
            backgroundImage: {
              url: "https://cdn.shopify.com/s/files/1/0968/7236/6467/files/dc554ad4-3d74-4086-9b09-7e1528a3b35b-2-31jjQuqcdERUaPJTgelJxrAbb9Gr3K.png?v=1776523438",
              alt: "Patterned interior rug detail",
              width: 1456,
              height: 819,
            },
            ctaText: "Shop Now",
            ctaLink: "/search?q=rugs",
          }}
        />

        <Container>
          <SearchProductsSlider title="Shop Bookcases" query="bookcase" limit={8} locale={locale} />
        </Container>

        <Container>
          <CollectionCards
            cards={[
              {
                id: "bedframes",
                title: "Bedframes",
                href: "/search?q=bedframe",
                image: {
                  url: "https://cdn.shopify.com/s/files/1/0968/7236/6467/files/03bb0e43-7cbe-47cb-bce1-14a24de06963-1-gIwQJOfLv5qxUGFlp3c6XLBrFvd5Hf_a0c0bd74-1f89-4858-95f1-85356353bbaf.png?v=1776523439",
                  alt: "Bedframe styled in a softly lit bedroom",
                },
              },
              {
                id: "nightstands",
                title: "Nightstands",
                href: "/search?q=nightstand",
                image: {
                  url: "https://cdn.shopify.com/s/files/1/0968/7236/6467/files/0cf98bc5-1cf3-4cc9-9077-6854b85171b3-1-e12Lkh7xxItTObH5r8AIH3W5I2oInl.png?v=1776523437",
                  alt: "Nightstand vignette with a styled lamp",
                },
              },
              {
                id: "consoles",
                title: "Consoles",
                href: "/search?q=console",
                image: {
                  url: "https://cdn.shopify.com/s/files/1/0968/7236/6467/files/e3e65c8b-7bbb-4916-b8a8-df2b773c710b-1-HnB2sfYQaDvBIvRza2HsRReiMo4wXm.png?v=1776523447",
                  alt: "Console table styled in an entryway",
                },
              },
            ]}
          />
        </Container>
      </Sections>
    </Page>
  );
}
