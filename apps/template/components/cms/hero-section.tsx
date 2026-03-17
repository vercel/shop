import type { HeroSection as HeroSectionType } from "@/lib/types";
import Image from "next/image";
import { PrefetchLink } from "@/components/prefetch-link";

interface HeroSectionProps {
  hero: HeroSectionType;
}

export function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section className="relative w-full rounded-lg overflow-hidden">
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] bg-linear-to-r from-slate-900 via-slate-800 to-slate-900">
        {hero.backgroundImage && (
          <Image
            src={hero.backgroundImage.url}
            alt={hero.backgroundImage.alt}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 md:p-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight">
              {hero.headline}
            </h1>
            {(hero.subheadline || hero.ctaText) && (
              <div className="hidden sm:flex items-center gap-2 text-sm sm:text-base text-white/90">
                {hero.subheadline && <span>{hero.subheadline}</span>}
                {hero.subheadline && hero.ctaText && <span>|</span>}
                {hero.ctaText && hero.ctaLink && (
                  <PrefetchLink
                    href={hero.ctaLink}
                    className="font-medium hover:underline inline-flex items-center gap-1"
                  >
                    {hero.ctaText}
                    <span aria-hidden="true">→</span>
                  </PrefetchLink>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
