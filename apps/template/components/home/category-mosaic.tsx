import Link from "next/link";

import { MerchSlot } from "@/components/ui/merch-slot";
import type { LayerTile } from "@/lib/home/layers";
import { TONES, type ToneId } from "@/lib/home/tones";
import { cn } from "@/lib/utils";

interface CategoryMosaicProps {
  eyebrow: string;
  tiles: LayerTile[];
  title: string;
  tone: ToneId;
  viewAllLabel: string;
}

const TILE_CLASSES = [
  "sm:col-span-2 sm:row-span-2 aspect-square sm:aspect-auto",
  "aspect-4/3",
  "aspect-4/3",
  "aspect-4/3",
  "aspect-4/3",
  "sm:col-span-2 aspect-16/9",
] as const;

export function CategoryMosaic({ eyebrow, tiles, title, tone, viewAllLabel }: CategoryMosaicProps) {
  const t = TONES[tone];

  return (
    <section className={cn("py-10 lg:py-16", t.bg, t.fg)}>
      <div className="mx-auto max-w-384 px-5 lg:px-10">
        <div className="mb-5 flex items-end justify-between gap-5">
          <div className="grid gap-2.5">
            <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", t.subtle)}>
              {eyebrow}
            </p>
            <h2 className="text-2xl sm:text-3xl">{title}</h2>
          </div>
          <Link
            href="/collections"
            className={cn(
              "shrink-0 text-sm font-medium underline-offset-4 transition-colors hover:underline",
              t.hoverLink,
            )}
          >
            {viewAllLabel}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {tiles.map((tile, index) => (
            <Link
              key={tile.href}
              href={tile.href}
              aria-label={tile.title}
              className={cn(
                "group relative block overflow-hidden rounded-lg",
                TONES[tile.tone].tileBg,
                TILE_CLASSES[index % TILE_CLASSES.length],
              )}
            >
              <MerchSlot label={tile.label} />
              <span className="absolute bottom-4 left-4 inline-flex items-center rounded-full bg-background px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-foreground transition-transform group-hover:-translate-y-0.5">
                {tile.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
