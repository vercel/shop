import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { MarketingImage } from "@/lib/types";

interface HeroBannerProps {
  backgroundImage?: MarketingImage | null;
  ctaLink: string;
  ctaText: string;
  headline: string;
}

export function HeroBanner({ backgroundImage, ctaLink, ctaText, headline }: HeroBannerProps) {
  return (
    <section className="relative w-full bg-black text-white">
      <div className="relative flex aspect-[4/3] flex-col justify-end overflow-hidden md:aspect-[8/3]">
        {backgroundImage && (
          <>
            <Image
              src={backgroundImage.url}
              alt={backgroundImage.alt}
              fill
              className="object-cover object-left-top w-[200%]! max-w-none! md:w-full! md:object-top"
              priority
              sizes="(min-width: 768px) 100vw, 200vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          </>
        )}
        <Container className="relative py-5 md:py-10">
          <div className="flex max-w-full flex-col items-start gap-5 text-left md:max-w-[50%]">
            <h1 className="text-3xl md:text-5xl">{headline}</h1>
            <Button
              asChild
              className="h-11 px-5 bg-white text-black hover:bg-white hover:opacity-90"
            >
              <Link href={ctaLink}>{ctaText}</Link>
            </Button>
          </div>
        </Container>
      </div>
    </section>
  );
}
