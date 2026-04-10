import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { HeroSection as HeroSectionType } from "@/lib/types";

interface HeroSectionProps {
  hero: HeroSectionType;
}

export function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative h-75 sm:h-100 md:h-125 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900">
        {hero.backgroundImage && (
          <>
            <Image
              src={hero.backgroundImage.url}
              alt={hero.backgroundImage.alt}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          </>
        )}

        <div className="absolute inset-0 flex items-center justify-center px-4 lg:px-8">
          <div className="flex flex-col items-center text-center gap-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight max-w-3xl">
              {hero.headline}
            </h1>
            {hero.subheadline && (
              <p className="text-sm sm:text-base text-white/90 max-w-xl">
                {hero.subheadline}
              </p>
            )}
            {hero.ctaText && hero.ctaLink && (
              <Button
                variant="outline"
                asChild
                className="h-11 px-6 border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white mt-2"
              >
                <Link href={hero.ctaLink}>{hero.ctaText}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
