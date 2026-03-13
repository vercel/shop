import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { HomeHero, HomeHeroSkeleton } from "@/components/cms/home-hero";
import {
  HomeSections,
  HomeSectionsSkeleton,
} from "@/components/cms/home-sections";
import { Container } from "@/components/layout/container";
import { getDefaultHomepage } from "@/lib/content/homepage";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  const title = t("homeTitle");
  const description = t("homeDescription");

  return {
    title,
    description,
    alternates: buildAlternates({ pathname: "/" }),
    openGraph: buildOpenGraph({
      title,
      description,
      url: "/",
      type: "website",
    }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const pagePromise = getDefaultHomepage(locale);

  return (
    <Container>
      <Suspense fallback={<HomeHeroSkeleton />}>
        <HomeHero pagePromise={pagePromise} />
      </Suspense>
      <Suspense fallback={<HomeSectionsSkeleton />}>
        <HomeSections pagePromise={pagePromise} />
      </Suspense>
    </Container>
  );
}
