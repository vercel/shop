import Image from "next/image";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import type { MarketingImage } from "@/lib/types";

interface PromoDuoTile {
  ctaText: string;
  headline: string;
  href: string;
  image?: MarketingImage | null;
  kicker: string;
}

interface PromoDuoProps {
  tiles: [PromoDuoTile, PromoDuoTile];
}

export function PromoDuo({ tiles }: PromoDuoProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2" data-slot="promo-duo">
      {tiles.map((tile) => (
        <Link
          key={tile.href}
          href={tile.href}
          className="group relative flex aspect-4/3 items-end overflow-hidden rounded-xl bg-foreground md:aspect-2/1"
        >
          {tile.image ? (
            <Image
              src={tile.image.url}
              alt={tile.image.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ImagePlaceholder className="size-full" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative grid gap-2.5 p-5 lg:p-10">
            <p className="text-xs font-medium uppercase tracking-widest text-white/80">
              {tile.kicker}
            </p>
            <h3 className="text-2xl text-white sm:text-3xl">{tile.headline}</h3>
            <span className="text-sm font-medium text-white underline-offset-4 group-hover:underline">
              {tile.ctaText}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
