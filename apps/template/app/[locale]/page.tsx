import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ProductsGrid } from "@/components/product/products-grid";
import { BannerSection } from "@/components/sections/banner-section";
import { CategorySlider } from "@/components/sections/category-slider";
import { HeroBanner } from "@/components/sections/hero-banner";
import { MarketingSplit } from "@/components/sections/marketing-split";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { shopConfig } from "@/shop.config";

const CAMPAIGN_COLLECTIONS: readonly string[] = [
  "hoodies",
  "jackets",
  "mens",
  "sweatshirts",
  "tees",
  "unisex",
  "womens",
  "youth",
];

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

export default async function HomePage({ searchParams }: PageProps<"/[locale]">) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("home")]);

  return (
    <Page className="pt-0">
      <Sections>
        <HeroBanner
          backgroundImage={{
            alt: "",
            url: "https://cdn.shopify.com/s/files/1/0748/3002/0662/files/2026-06-27T12-59-10-736Z-landscape-athleisure-dark-split-hero-banner.jpg?v=1782565155",
          }}
          headline={t("headline")}
          ctaText={t("ctaText")}
          ctaLink="/collections/all"
        />

        <Container>
          <ProductsGrid
            campaignCollections={CAMPAIGN_COLLECTIONS}
            columns={5}
            fallbackSortKey="price-high-to-low"
            limit={5}
            locale={locale}
            rememberedCollectionCookie="state_v0"
            searchParams={searchParams}
            title={t("pickedForYou")}
          />
        </Container>

        <Container>
          <CategorySlider
            categories={[
              {
                href: "/collections/womens",
                image:
                  "https://cdn.shopify.com/s/files/1/0748/3002/0662/files/embermode-hoodie-womens-3c6080-fashion-full-body-yellow.png?v=1780094433",
                label: t("categories.womens"),
              },
              {
                href: "/collections/mens",
                image:
                  "https://cdn.shopify.com/s/files/1/0748/3002/0662/files/pacepoint-tee-mens-c96538-fashion-full-body-grey.png?v=1781011245",
                label: t("categories.mens"),
              },
              {
                href: "/collections/unisex",
                image:
                  "https://cdn.shopify.com/s/files/1/0748/3002/0662/files/pivotlink-tee-unisex-58a99a-fashion-full-body-yellow.png?v=1779626845",
                label: t("categories.unisex"),
              },
              {
                href: "/collections/youth",
                image:
                  "https://cdn.shopify.com/s/files/1/0748/3002/0662/files/orbitstructure-jacket-youth-21e051-fashion-full-body-black.png?v=1778847729",
                label: t("categories.youth"),
              },
            ]}
          />
        </Container>

        <Container>
          <ProductsGrid
            collectionUrl="/collections/all"
            columns={5}
            limit={5}
            locale={locale}
            title={t("newArrivalsTitle")}
          />
        </Container>

        <BannerSection
          headingLevel="h2"
          hero={{
            id: "homepage-secondary-hero",
            backgroundImage: {
              alt: "",
              url: "https://cdn.shopify.com/s/files/1/0748/3002/0662/files/blur-hero.png?v=1782487305",
            },
            headline: t("secondaryHero.headline"),
            ctaText: t("secondaryHero.ctaText"),
            ctaLink: "/collections/clearance",
          }}
        />

        <Container>
          <ProductsGrid
            collection="frontpage"
            limit={4}
            locale={locale}
            title={t("allTimeFavorites")}
          />
        </Container>

        <Container>
          <MarketingSplit
            reverse
            title={t("marketing.secondary.title")}
            body={t("marketing.secondary.body")}
            ctaLink="/collections/all"
            ctaText={t("marketing.secondary.cta")}
            image={{
              alt: "Two people wearing all-black activewear",
              url: "https://cdn.shopify.com/s/files/1/0748/3002/0662/files/2026-06-27T22-04-19-534Z-landscape-a-man-and-a-woman-of-different-ethnic-backgrounds-in-all-bla.jpg?v=1782597864",
            }}
          />
        </Container>
      </Sections>
    </Page>
  );
}
