import Link from "next/link";

import { MerchSlot } from "@/components/ui/merch-slot";
import { TONES, type ToneId } from "@/lib/home/tones";
import { cn } from "@/lib/utils";

interface PromoBannerProps {
  ctaHref: string;
  ctaLabel: string;
  mediaSlotLabel: string;
  subheadline: string;
  title: string;
  tone: ToneId;
}

export function PromoBanner({
  ctaHref,
  ctaLabel,
  mediaSlotLabel,
  subheadline,
  title,
  tone,
}: PromoBannerProps) {
  const t = TONES[tone];

  return (
    <section className={cn(t.bg, t.fg)}>
      <div className="relative">
        <div className="absolute inset-0">
          <MerchSlot label={mediaSlotLabel} />
        </div>
        <div className="relative mx-auto flex max-w-384 flex-col items-start gap-5 px-5 py-20 lg:px-10 lg:py-28">
          <div className="grid max-w-2xl gap-2.5">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl">{title}</h2>
            <p className={cn("text-sm md:text-base", t.subtle)}>{subheadline}</p>
          </div>
          <Link
            href={ctaHref}
            className={cn(
              "inline-flex h-12 items-center justify-center rounded-lg px-8 text-sm font-medium transition-colors",
              t.solidButton,
            )}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
