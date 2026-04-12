import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MarketingPageRenderer } from "@/components/cms/page-renderer";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllLocalMarketingPageSlugs, getLocalMarketingPage } from "@/lib/content/pages";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/params";
import { buildOpenGraph } from "@/lib/seo";
import type { MarketingPage } from "@/lib/types";

export async function generateStaticParams() {
  const localPages = getAllLocalMarketingPageSlugs().map((pair) => ({
    slug: pair.slug,
  }));

  return localPages.length > 0 ? localPages : [{ slug: "__placeholder__" }];
}

async function getPageDetails(slug: string, locale: Locale) {
  "use cache";
  return getLocalMarketingPage(slug, locale);
}

export async function generateMetadata({ params }: PageProps<"/pages/[slug]">): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);

  const page = await getPageDetails(slug, locale);

  if (!page) {
    return {
      title: slug,
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    alternates: {
      canonical: `/pages/${page.slug}`,
    },
    openGraph: buildOpenGraph({
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      url: `/pages/${page.slug}`,
      type: "website",
      images: page.heroSection?.backgroundImage
        ? [page.heroSection.backgroundImage.url]
        : ["/og-default.png"],
    }),
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      images: page.heroSection?.backgroundImage
        ? [page.heroSection.backgroundImage.url]
        : ["/og-default.png"],
    },
  };
}

export default async function MarketingContentPage({ params }: PageProps<"/pages/[slug]">) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const pagePromise = getPageDetails(slug, locale);

  return (
    <Container>
      <Suspense fallback={<MarketingPageSkeleton />}>
        <MarketingPageContent pagePromise={pagePromise} />
      </Suspense>
    </Container>
  );
}

async function MarketingPageContent({
  pagePromise,
}: {
  pagePromise: Promise<MarketingPage | null>;
}) {
  const page = await pagePromise;

  if (!page) {
    notFound();
  }

  return <MarketingPageRenderer page={page} />;
}

function MarketingPageSkeleton() {
  const skeletonSlots = [1, 2, 3, 4, 5] as const;

  return (
    <div className="flex flex-col gap-12 pb-12">
      <Skeleton className="h-100 w-full rounded-xl" />
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <Skeleton className="mb-8 h-8 w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {skeletonSlots.map((slot) => (
              <Skeleton key={`marketing-skeleton-${slot}`} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
