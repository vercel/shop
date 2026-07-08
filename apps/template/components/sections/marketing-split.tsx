import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import type { MarketingImage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MarketingSplitProps {
  body: string;
  ctaLink: string;
  ctaText: string;
  image?: MarketingImage | null;
  reverse?: boolean;
  title: string;
}

export function MarketingSplit({
  body,
  ctaLink,
  ctaText,
  image,
  reverse = false,
  title,
}: MarketingSplitProps) {
  return (
    <div className="grid items-center gap-5 lg:grid-cols-2 lg:gap-10" data-slot="marketing-split">
      {image ? (
        <div
          className={cn(
            "relative aspect-video w-full overflow-hidden rounded-xl bg-accent",
            reverse && "lg:order-last",
          )}
        >
          <Image
            src={image.url}
            alt={image.alt}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
      ) : (
        <ImagePlaceholder
          className={cn("aspect-video w-full rounded-xl bg-accent", reverse && "lg:order-last")}
          iconClassName="text-white"
        />
      )}
      <div className="grid gap-5">
        <div className="grid gap-2.5">
          <h2 className="text-2xl sm:text-3xl">{title}</h2>
          <p className="max-w-prose text-muted-foreground">{body}</p>
        </div>
        <Button asChild className="h-11 w-fit px-5">
          <Link href={ctaLink}>{ctaText}</Link>
        </Button>
      </div>
    </div>
  );
}
