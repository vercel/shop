import Link from "next/link";

import { Container } from "@/components/ui/container";
import { MerchSlot } from "@/components/ui/merch-slot";
import type { LayerTile } from "@/lib/home/layers";
import { TONES, type ToneId } from "@/lib/home/tones";
import { cn } from "@/lib/utils";

interface CategoryBandProps {
  links: { href: string; label: string }[];
  subheadline: string;
  tile: LayerTile;
  title: string;
  tone: ToneId;
}

export function CategoryBand({ links, subheadline, tile, title, tone }: CategoryBandProps) {
  const t = TONES[tone];
  const tileTone = TONES[tile.tone];

  return (
    <section className={cn("py-10", t.bg, t.fg)}>
      <Container className="px-5 lg:px-10">
        <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-10">
          <div className="grid gap-2.5">
            <h2 className="text-2xl sm:text-3xl">{title}</h2>
            <p className={cn("text-sm", t.subtle)}>{subheadline}</p>
          </div>
          <nav aria-label={title} className="flex flex-wrap gap-2.5 lg:justify-end">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-full border px-5 text-sm font-medium transition-colors",
                  t.pillBorder,
                  t.pillHover,
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link
          href={tile.href}
          className="group mt-10 block overflow-hidden rounded-xl"
          aria-label={tile.title}
        >
          <div className={cn("relative aspect-16/7", tileTone.tileBg)}>
            <MerchSlot label={tile.label} />
            <span className="absolute bottom-5 left-5 inline-flex items-center rounded-full bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-foreground transition-transform group-hover:-translate-y-0.5">
              {tile.title}
            </span>
          </div>
        </Link>
      </Container>
    </section>
  );
}
