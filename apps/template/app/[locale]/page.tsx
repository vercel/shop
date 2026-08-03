import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CollectionSlider } from "@/components/product/collection-slider";
import { ProductsGrid } from "@/components/product/products-grid";
import { BannerSection } from "@/components/sections/banner-section";
import { CategoryRail } from "@/components/sections/category-rail";
import { CategorySlider } from "@/components/sections/category-slider";
import { EditorialGrid } from "@/components/sections/editorial-grid";
import { HeroBanner } from "@/components/sections/hero-banner";
import { MarketingSplit } from "@/components/sections/marketing-split";
import { MarqueeBanner } from "@/components/sections/marquee-banner";
import { PromoDuo } from "@/components/sections/promo-duo";
import { Testimonials } from "@/components/sections/testimonials";
import { ValueProps } from "@/components/sections/value-props";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { shopConfig } from "@/lib/config";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

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

const CDN = "https://cdn.shopify.com/s/files/1/0748/3002/0662";

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
            url: `${CDN}/files/2026-06-27T12-59-10-736Z-landscape-athleisure-dark-split-hero-banner.jpg?v=1782565155`,
          }}
          headline={t("headline")}
          ctaText={t("ctaText")}
          ctaLink="/collections/all"
        />

        <Container>
          <ProductsGrid
            collectionUrl="/collections/all"
            columns={5}
            limit={5}
            locale={locale}
            title={t("newArrivalsTitle")}
          />
        </Container>

        <Container>
          <CategoryRail
            title={t("categoryRail")}
            items={[
              {
                href: "/collections/jackets",
                image: `${CDN}/files/glidestack-jacket-unisex-5c042a-main-blue.png?v=1780098768`,
                label: t("rail.jackets"),
              },
              {
                href: "/collections/hoodies",
                image: `${CDN}/files/halogauge-hoodie-unisex-a7831c-main-green.png?v=1782862978`,
                label: t("rail.hoodies"),
              },
              {
                href: "/collections/sweatshirts",
                image: `${CDN}/files/vitalmode-sweatshirt-womens-3f2c60-main-red.png?v=1785542444`,
                label: t("rail.sweatshirts"),
              },
              {
                href: "/collections/tees",
                image: `${CDN}/files/axissync-tee-womens-228e89-main-blue.png?v=1782834466`,
                label: t("rail.tees"),
              },
              {
                href: "/collections/long-tees",
                image: `${CDN}/files/cadenceshield-long-tee-womens-68926e-main-grey.png?v=1782762408`,
                label: t("rail.longTees"),
              },
              {
                href: "/collections/vests",
                image: `${CDN}/files/frameprime-vest-youth-841ab9-main-green.png?v=1782590238`,
                label: t("rail.vests"),
              },
              {
                href: "/collections/tanks",
                image: `${CDN}/files/pivotlink-tee-unisex-58a99a-fashion-full-body-yellow.png?v=1779626845`,
                label: t("rail.tanks"),
              },
            ]}
          />
        </Container>

        <Container>
          <CategorySlider
            categories={[
              {
                href: "/collections/womens",
                image: `${CDN}/files/embermode-hoodie-womens-3c6080-fashion-full-body-yellow.png?v=1780094433`,
                label: t("categories.womens"),
              },
              {
                href: "/collections/mens",
                image: `${CDN}/files/pacepoint-tee-mens-c96538-fashion-full-body-grey.png?v=1781011245`,
                label: t("categories.mens"),
              },
              {
                href: "/collections/unisex",
                image: `${CDN}/files/pivotlink-tee-unisex-58a99a-fashion-full-body-yellow.png?v=1779626845`,
                label: t("categories.unisex"),
              },
              {
                href: "/collections/youth",
                image: `${CDN}/files/orbitstructure-jacket-youth-21e051-fashion-full-body-black.png?v=1778847729`,
                label: t("categories.youth"),
              },
            ]}
          />
        </Container>

        <MarqueeBanner
          items={[
            t("marquee.shipping"),
            t("marquee.fit"),
            t("marquee.made"),
            t("marquee.carbon"),
            t("marquee.members"),
          ]}
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
          <PromoDuo
            tiles={[
              {
                ctaText: t("promo.clearance.cta"),
                headline: t("promo.clearance.headline"),
                href: "/collections/clearance",
                image: {
                  alt: "",
                  url: `${CDN}/files/atlasrange-jacket-mens-871b4a-main-yellow.png?v=1780164276`,
                },
                kicker: t("promo.clearance.kicker"),
              },
              {
                ctaText: t("promo.youth.cta"),
                headline: t("promo.youth.headline"),
                href: "/collections/youth",
                image: {
                  alt: "",
                  url: `${CDN}/collections/2026-06-27T21-32-29-493Z-landscape-youth-hero-motion-blur.jpg?v=1782596029`,
                },
                kicker: t("promo.youth.kicker"),
              },
            ]}
          />
        </Container>

        <Container>
          <CollectionSlider
            collection="jackets"
            collectionUrl="/collections/jackets"
            limit={8}
            locale={locale}
            title={t("jackets")}
          />
        </Container>

        <BannerSection
          headingLevel="h2"
          hero={{
            id: "homepage-secondary-hero",
            backgroundImage: {
              alt: "",
              url: `${CDN}/files/blur-hero.png?v=1782487305`,
            },
            headline: t("secondaryHero.headline"),
            ctaText: t("secondaryHero.ctaText"),
            ctaLink: "/collections/clearance",
          }}
        />

        <Container>
          <EditorialGrid
            title={t("editorial.title")}
            stories={[
              {
                href: "/collections/womens",
                image: {
                  alt: "",
                  url: `${CDN}/collections/2026-06-27T12-59-10-736Z-landscape-athleisure-dark-split-hero-banner.jpg?v=1782580131`,
                },
                kicker: t("editorial.studio.kicker"),
                title: t("editorial.studio.title"),
              },
              {
                href: "/collections/mens",
                image: {
                  alt: "",
                  url: `${CDN}/collections/2026-06-27T21-15-47-232Z-landscape-landscape-monochrome-male-runner-recovery-hero.jpg?v=1782595019`,
                },
                kicker: t("editorial.layering.kicker"),
                title: t("editorial.layering.title"),
              },
              {
                href: "/collections/unisex",
                image: {
                  alt: "",
                  url: `${CDN}/collections/2026-06-27T21-26-52-691Z-landscape-unisex-running-hero-abstract-bw.jpg?v=1782595744`,
                },
                kicker: t("editorial.fabric.kicker"),
                title: t("editorial.fabric.title"),
              },
            ]}
          />
        </Container>

        <Container>
          <CollectionSlider
            collection="hoodies"
            collectionUrl="/collections/hoodies"
            limit={8}
            locale={locale}
            title={t("bestsellers")}
          />
        </Container>

        <Container>
          <ProductsGrid
            collection="frontpage"
            limit={4}
            locale={locale}
            title={t("allTimeFavorites")}
          />
        </Container>

        <Container>
          <Testimonials
            title={t("testimonials.title")}
            ratingLabel={(rating) => t("testimonials.rating", { rating: String(rating) })}
            items={[
              {
                author: t("testimonials.one.author"),
                detail: t("testimonials.one.detail"),
                quote: t("testimonials.one.quote"),
                rating: 5,
              },
              {
                author: t("testimonials.two.author"),
                detail: t("testimonials.two.detail"),
                quote: t("testimonials.two.quote"),
                rating: 5,
              },
              {
                author: t("testimonials.three.author"),
                detail: t("testimonials.three.detail"),
                quote: t("testimonials.three.quote"),
                rating: 4,
              },
            ]}
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
              url: `${CDN}/files/2026-06-27T22-04-19-534Z-landscape-a-man-and-a-woman-of-different-ethnic-backgrounds-in-all-bla.jpg?v=1782597864`,
            }}
          />
        </Container>

        <Container>
          <ValueProps
            items={[
              {
                body: t("valueProps.shipping.body"),
                icon: "shipping",
                title: t("valueProps.shipping.title"),
              },
              {
                body: t("valueProps.returns.body"),
                icon: "returns",
                title: t("valueProps.returns.title"),
              },
              {
                body: t("valueProps.materials.body"),
                icon: "leaf",
                title: t("valueProps.materials.title"),
              },
              {
                body: t("valueProps.support.body"),
                icon: "support",
                title: t("valueProps.support.title"),
              },
            ]}
          />
        </Container>
      </Sections>
    </Page>
  );
}
