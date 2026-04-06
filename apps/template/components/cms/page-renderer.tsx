import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { Homepage, MarketingPage } from "@/lib/types";

import { FeaturedProductsSection } from "./blocks/featured-products";
import { ImageGallerySection } from "./blocks/image-gallery";
import { ProductGridSection } from "./blocks/product-grid";
import { PromoBannerSection } from "./blocks/promo-banner";
import { RichTextSection } from "./blocks/rich-text";
import { TopProductsSection } from "./blocks/top-products";
import { HeroSection } from "./hero-section";

interface MarketingPageRendererProps {
  page: MarketingPage | Homepage;
}

export function MarketingPageRenderer({ page }: MarketingPageRendererProps) {
  return (
    <div className="flex flex-col gap-8 pb-16">
      {page.heroSection && <HeroSection hero={page.heroSection} />}

      {page.sections.map((section) => (
        <ContentSectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}

interface ContentSectionRendererProps {
  section: MarketingPage["sections"][number];
}

const ASYNC_BLOCK_TYPES = new Set(["featured-products", "product-grid", "products"]);

function ContentSectionRenderer({ section }: ContentSectionRendererProps) {
  const content = renderBlock(section);
  if (!content) return null;

  if (ASYNC_BLOCK_TYPES.has(section.blockType)) {
    return (
      <Suspense fallback={<SectionSkeleton blockType={section.blockType} />}>{content}</Suspense>
    );
  }

  return content;
}

function renderBlock(section: MarketingPage["sections"][number]) {
  switch (section.blockType) {
    case "featured-products":
      return <FeaturedProductsSection section={section} />;
    case "product-grid":
      return <ProductGridSection section={section} />;
    case "promo-banner":
      return <PromoBannerSection section={section} />;
    case "image-gallery":
      return <ImageGallerySection section={section} />;
    case "rich-text":
      return <RichTextSection section={section} />;
    case "products":
      return <TopProductsSection section={section} />;
    default:
      return null;
  }
}

function SectionSkeleton({ blockType }: { blockType: string }) {
  const skeletonSlots = [1, 2, 3, 4, 5] as const;

  switch (blockType) {
    case "featured-products":
    case "product-grid":
      return (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <Skeleton className="mb-8 h-8 w-48" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {skeletonSlots.map((slot) => (
                <Skeleton key={`product-skeleton-${slot}`} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        </section>
      );
    case "products":
      return (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4 overflow-hidden">
            {skeletonSlots.map((slot) => (
              <Skeleton
                key={`carousel-skeleton-${slot}`}
                className="aspect-square w-50 shrink-0 rounded-lg"
              />
            ))}
          </div>
        </div>
      );
    default:
      return <Skeleton className="h-48 w-full rounded-xl" />;
  }
}
