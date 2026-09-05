import Image from "next/image";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import type { CollectionWithThumbnail } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface CollectionCardProps {
  className?: string;
  collection: CollectionWithThumbnail;
  sizes?: string;
  viewCollectionLabel: string;
}

export function CollectionCard({
  className,
  collection,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  viewCollectionLabel,
}: CollectionCardProps) {
  const { handle, thumbnail, title } = collection;

  return (
    <Link
      aria-label={`${viewCollectionLabel}: ${title}`}
      className={cn("flex flex-col h-full overflow-hidden", className)}
      href={`/collections/${handle}`}
    >
      <div data-slot="collection-card-image" className="relative aspect-square overflow-hidden">
        {thumbnail ? (
          <Image
            alt={thumbnail.altText || title}
            className="object-cover"
            fill
            sizes={sizes}
            src={thumbnail.url}
          />
        ) : (
          <ImagePlaceholder className="size-full" />
        )}
      </div>
      <h2
        data-slot="collection-card-title"
        className="py-2.5 text-sm font-medium text-foreground line-clamp-1"
      >
        {title}
      </h2>
    </Link>
  );
}
