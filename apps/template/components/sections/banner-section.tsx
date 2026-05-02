import type { StaticImageData } from "next/image";
import Image from "next/image";
import Link from "next/link";

import { AutoPlayVideo } from "@/components/ui/auto-play-video";
import { Button } from "@/components/ui/button";
import type { BannerSection as BannerSectionType } from "@/lib/types";
import heroDefault from "@/public/hero.jpg";

interface BannerSectionProps {
  hero: BannerSectionType;
  headingLevel?: "h1" | "h2";
}

export function BannerSection({ hero, headingLevel = "h1" }: BannerSectionProps) {
  const Heading = headingLevel;
  const video = hero.backgroundVideo;
  const image = hero.backgroundImage ?? heroDefault;
  const isStatic = typeof image === "object" && "src" in image;

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative grid bg-linear-to-b from-black via-neutral-950 to-neutral-900">
        <div className="col-start-1 row-start-1 hidden md:block md:aspect-[3/1]" />

        {video ? (
          <>
            <AutoPlayVideo
              src={video.url}
              previewImage={
                video.previewImage
                  ? {
                      src: video.previewImage.url,
                      alt: video.previewImage.alt,
                    }
                  : null
              }
              className="absolute inset-0 h-full w-full object-cover"
              priorityImage
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          </>
        ) : isStatic ? (
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

        <div className="relative col-start-1 row-start-1 flex items-center justify-center px-5 py-10 lg:px-10">
          <div className="flex flex-col items-center text-center gap-2.5">
            <Heading className="text-3xl md:text-5xl font-semibold text-white tracking-tight max-w-3xl">
              {hero.headline}
            </Heading>
            {hero.subheadline && (
              <p className="text-sm md:text-base text-white max-w-xl">{hero.subheadline}</p>
            )}
            {hero.ctaText && hero.ctaLink && (
              <Button
                asChild
                className="h-11 px-5 bg-background text-foreground hover:bg-background/90"
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
