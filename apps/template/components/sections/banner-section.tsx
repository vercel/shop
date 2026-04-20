import type { StaticImageData } from "next/image";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { BannerSection as BannerSectionType } from "@/lib/types";
import heroDefault from "@/public/hero.jpg";

interface BannerSectionProps {
  hero: BannerSectionType;
}

export function BannerSection({ hero }: BannerSectionProps) {
  const image = hero.backgroundImage ?? heroDefault;
  const isStatic = typeof image === "object" && "src" in image;

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative grid bg-linear-to-b from-black via-neutral-950 to-neutral-900">
        {/* Aspect-ratio spacer: sets the minimum height */}
        <div className="col-start-1 row-start-1 aspect-[16/9] md:aspect-[3/1]" />

        {isStatic ? (
          <>
            <Image
              src={image as StaticImageData}
              alt="Hero background"
              fill
              className="object-cover"
              placeholder="blur"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          image && (
            <>
              <Image
                src={(image as { url: string }).url}
                alt={(image as { alt: string }).alt}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            </>
          )
        )}

        <div className="relative col-start-1 row-start-1 flex items-center justify-center px-5 py-5 lg:px-10 lg:py-10">
          <div className="flex flex-col items-center text-center gap-2.5">
            <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight max-w-3xl">
              {hero.headline}
            </h1>
            {hero.subheadline && (
              <p className="text-sm md:text-base text-white max-w-xl">{hero.subheadline}</p>
            )}
            {hero.ctaText && hero.ctaLink && (
              <Button
                variant="outline"
                asChild
                className="h-11 px-5 border-white text-white bg-transparent hover:bg-white/10 hover:text-white"
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
