import Image from "next/image";

import { Button } from "@/components/ui/button";
import { ShopLink as Link } from "@/components/ui/shop-link";
import type { ContentSection } from "@/lib/types";

interface PromoBannerSectionProps {
  section: ContentSection;
}

export function PromoBannerSection({ section }: PromoBannerSectionProps) {
  const { title, media, settings } = section;
  const backgroundImage = media[0];
  const ctaText = typeof settings?.ctaText === "string" ? settings.ctaText : undefined;
  const ctaLink = typeof settings?.ctaLink === "string" ? settings.ctaLink : undefined;
  const subtitle = typeof settings?.subtitle === "string" ? settings.subtitle : undefined;

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <div className="relative overflow-hidden h-50 sm:h-70 bg-linear-to-r from-primary/90 to-primary/70">
          {backgroundImage && (
            <Image
              src={backgroundImage.url}
              alt={backgroundImage.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-r from-black/50 to-transparent" />

          <div className="absolute inset-0 flex items-center">
            <div className="px-6 sm:px-12 max-w-lg">
              {title && (
                <h2 className="mb-2 text-3xl font-semibold tracking-tight text-white">{title}</h2>
              )}
              {subtitle && <p className="text-base sm:text-lg text-white/90 mb-4">{subtitle}</p>}
              {ctaText && ctaLink && (
                <Button asChild variant="secondary" size="lg" className="font-semibold">
                  <Link href={ctaLink}>{ctaText}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
