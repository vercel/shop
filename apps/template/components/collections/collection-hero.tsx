import Image from "next/image";

import { Container } from "@/components/ui/container";
import type { Image as ImageType } from "@/lib/types";

interface CollectionHeroProps {
  image: ImageType;
  title: string;
}

export function CollectionHero({ image, title }: CollectionHeroProps) {
  return (
    <section className="relative w-full bg-black text-white">
      <div className="relative flex aspect-[4/3] flex-col justify-end md:aspect-[8/3]">
        <Image
          src={image.url}
          alt={image.altText}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        <Container className="relative py-5 md:py-10">
          <h1 className="text-3xl md:text-5xl">{title}</h1>
        </Container>
      </div>
    </section>
  );
}
