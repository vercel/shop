import Link from "next/link";

import { MerchSlot } from "@/components/ui/merch-slot";
import { TONES, type ToneId } from "@/lib/home/tones";
import { cn } from "@/lib/utils";

interface EditorialSplitProps {
  ctaHref: string;
  ctaLabel: string;
  mediaSide: "left" | "right";
  mediaSlotLabel: string;
  mediaTone: ToneId;
  subheadline: string;
  title: string;
  tone: ToneId;
}

export function EditorialSplit({
  ctaHref,
  ctaLabel,
  mediaSide,
  mediaSlotLabel,
  mediaTone,
  subheadline,
  title,
  tone,
}: EditorialSplitProps) {
  const t = TONES[tone];

  return (
    <section className={cn(t.bg, t.fg)}>
      <div className="grid lg:grid-cols-2">
        <div
          className={cn(
            "relative aspect-4/3 lg:aspect-auto lg:min-h-130",
            TONES[mediaTone].tileBg,
            mediaSide === "right" && "lg:order-2",
          )}
        >
          <MerchSlot label={mediaSlotLabel} />
        </div>
        <div className="flex items-center px-5 py-10 lg:px-20 lg:py-20">
          <div className="grid gap-5">
            <div className="grid gap-2.5">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl">{title}</h2>
              <p className={cn("max-w-xl text-sm md:text-base", t.subtle)}>{subheadline}</p>
            </div>
            <div>
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
        </div>
      </div>
    </section>
  );
}
