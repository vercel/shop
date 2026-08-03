import Image from "next/image";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import type { MarketingImage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface EditorialGridStory {
  href: string;
  image?: MarketingImage | null;
  kicker: string;
  title: string;
}

interface EditorialGridProps {
  /** The first story renders as the tall feature tile; the rest stack beside it. */
  stories: EditorialGridStory[];
  title: string;
}

export function EditorialGrid({ stories, title }: EditorialGridProps) {
  const [feature, ...rest] = stories;
  if (!feature) return null;

  return (
    <div className="grid gap-4" data-slot="editorial-grid">
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <EditorialCard
          story={feature}
          className="lg:aspect-4/5"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:content-between">
          {rest.map((story) => (
            <EditorialCard
              key={story.href}
              story={story}
              className="aspect-4/3 lg:aspect-square"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EditorialCard({
  className,
  sizes,
  story,
}: {
  className?: string;
  sizes: string;
  story: EditorialGridStory;
}) {
  return (
    <Link
      href={story.href}
      className={cn(
        "group relative flex aspect-4/3 items-end overflow-hidden rounded-xl bg-foreground",
        className,
      )}
    >
      {story.image ? (
        <Image
          src={story.image.url}
          alt={story.image.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <ImagePlaceholder className="size-full" />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
      <div className="relative grid gap-1 p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-white/80">
          {story.kicker}
        </p>
        <h3 className="text-xl text-white group-hover:underline sm:text-2xl">{story.title}</h3>
      </div>
    </Link>
  );
}
