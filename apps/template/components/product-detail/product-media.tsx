"use client";

import { cn } from "cn";
import Image, { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";

import { AutoPlayVideo } from "@/components/ui/auto-play-video";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import type { Image as ImageType, Video } from "@/lib/types";

import { Lightbox, LightboxTrigger } from "./lightbox";

type MediaItem =
  | { type: "image"; image: ImageType }
  | { type: "placeholder" }
  | { type: "video"; video: Video };

function mediaKey(item: MediaItem) {
  if (item.type === "image") return item.image.url;
  if (item.type === "video") return item.video.url;
  return "placeholder";
}

// The LCP image gets a preload link + eager + fetchpriority=high (`preload` alone no longer implies high).
// Everything else stays lazy so the hidden viewport twin (mobile carousel vs desktop grid) never downloads.
const LCP_IMAGE_PROPS = { preload: true, fetchPriority: "high" } as const;

const LAZY_IMAGE_PROPS = { loading: "lazy" } as const;

const GRID_SIZES = "(min-width: 1024px) 25vw, 50vw";
// Tailwind `lg`, where the 2x2 grid replaces the carousel.
const DESKTOP_MEDIA = "(min-width: 1024px)";
// The 2x2 desktop grid is entirely above the fold. Its non-LCP tiles stay `loading="lazy"` on the
// <img> (so mobile never fetches them) but get a media-scoped preload so desktop requests all four
// tiles at parse time instead of one at a time after layout. Uses getImageProps so the preload's
// srcset/sizes match the <img> exactly and the browser reuses the response.
const DESKTOP_GRID_PRELOAD_COUNT = 4;

function preloadDesktopGridImage(image: ImageType) {
  const { props } = getImageProps({
    src: image.url,
    alt: "",
    fill: true,
    sizes: GRID_SIZES,
  });
  preload(props.src, {
    as: "image",
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    media: DESKTOP_MEDIA,
  });
}

function MediaImage({
  item,
  title,
  idx,
  sizes,
  priority,
  className,
}: {
  item: Extract<MediaItem, { type: "image" }>;
  title: string;
  idx: number;
  sizes: string;
  priority: boolean;
  className?: string;
}) {
  return (
    <Image
      src={item.image.url}
      alt={item.image.altText || `${title} image ${idx + 1}`}
      fill
      className={cn("object-cover", className)}
      sizes={sizes}
      {...(priority ? LCP_IMAGE_PROPS : LAZY_IMAGE_PROPS)}
      draggable={false}
    />
  );
}

function MediaVideo({
  item,
  sizes,
  priority,
  className,
}: {
  item: Extract<MediaItem, { type: "video" }>;
  sizes: string;
  priority: boolean;
  className?: string;
}) {
  return (
    <AutoPlayVideo
      src={item.video.url}
      previewImage={
        item.video.previewImage
          ? {
              src: item.video.previewImage.url,
              alt: item.video.previewImage.altText || "",
            }
          : null
      }
      sizes={sizes}
      previewImageFetchPriority={priority ? "high" : "auto"}
      previewImageLoading={priority ? "eager" : "lazy"}
      className={cn("h-full w-full scale-[1.04] object-cover", className)}
    />
  );
}

function Carousel({
  mediaItems,
  title,
  hasColorSlot,
  children,
}: {
  mediaItems: MediaItem[];
  title: string;
  hasColorSlot: boolean;
  children?: React.ReactNode;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [itemCount, setItemCount] = useState(mediaItems.length);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const scrollToImage = (index: number) => {
    if (!container) return;
    container.scrollTo({
      left: index * container.offsetWidth,
      behavior: "smooth",
    });
    setSelectedIndex(index);
  };
  useEffect(() => {
    if (!container) return;

    // Variant/video items arrive via slot children, so count the rendered DOM, not just mediaItems.
    const sync = () => {
      const width = container.offsetWidth;
      if (width === 0) return;
      const total = Math.max(1, container.children.length);
      setItemCount(total);
      setSelectedIndex(Math.min(Math.max(0, Math.round(container.scrollLeft / width)), total - 1));
    };

    // New media set: snap back to the first slide before observers take over.
    container.scrollTo({ left: 0 });
    sync();

    container.addEventListener("scroll", sync, { passive: true });
    const resizeObserver = new ResizeObserver(sync);
    resizeObserver.observe(container);
    const mutationObserver = new MutationObserver(sync);
    mutationObserver.observe(container, { childList: true });

    return () => {
      container.removeEventListener("scroll", sync);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [container]);
  return (
    <div className="grid gap-5">
      <div
        ref={setContainer}
        className="relative overflow-x-auto flex snap-x snap-mandatory overscroll-x-contain scrollbar-hide -mx-5 w-[calc(100%+2.5rem)]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
        {mediaItems.map((item, idx) => {
          const priority = !hasColorSlot && idx === 0;
          return (
            <div
              key={mediaKey(item)}
              className="relative shrink-0 w-full snap-start snap-always overflow-hidden aspect-square"
            >
              {item.type === "video" ? (
                <MediaVideo item={item} sizes="100vw" priority={priority} />
              ) : item.type === "placeholder" ? (
                <ImagePlaceholder className="size-full" />
              ) : (
                <MediaImage item={item} title={title} idx={idx} sizes="100vw" priority={priority} />
              )}
            </div>
          );
        })}
      </div>

      {/* Dot indicators – reserve space but hide when there's only one image */}
      <div className={cn("flex justify-center gap-2", itemCount <= 1 && "invisible")}>
        {Array.from({ length: itemCount }, (_, idx) => (
          <button
            type="button"
            key={idx}
            onClick={() => scrollToImage(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === selectedIndex
                ? "bg-foreground w-8"
                : "bg-muted-foreground/30 w-1.5 hover:bg-muted-foreground/50",
            )}
            aria-label={`Go to image ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function GridItem({
  item,
  title,
  idx,
  priority,
}: {
  item: MediaItem;
  title: string;
  idx: number;
  priority: boolean;
}) {
  return (
    <div className="relative w-full overflow-hidden aspect-square">
      {item.type === "video" ? (
        <MediaVideo item={item} sizes={GRID_SIZES} priority={priority} />
      ) : item.type === "placeholder" ? (
        <ImagePlaceholder className="size-full" />
      ) : (
        <LightboxTrigger item={item}>
          <MediaImage item={item} title={title} idx={idx} sizes={GRID_SIZES} priority={priority} />
        </LightboxTrigger>
      )}
    </div>
  );
}

function Grid({
  mediaItems,
  title,
  hasColorSlot,
  interactive = true,
  children,
}: {
  mediaItems: MediaItem[];
  title: string;
  hasColorSlot: boolean;
  interactive?: boolean;
  children?: React.ReactNode;
}) {
  // The color slot (children) occupies the first tile when present.
  const firstTileOffset = hasColorSlot ? 1 : 0;
  for (const [idx, item] of mediaItems.entries()) {
    const tile = idx + firstTileOffset;
    if (tile >= DESKTOP_GRID_PRELOAD_COUNT) break;
    // Tile 0 is the LCP image and already preloaded via next/image's `preload` prop.
    if (tile > 0 && item.type === "image") preloadDesktopGridImage(item.image);
  }

  const grid = (
    <div className="grid grid-cols-2 gap-2.5">
      {children}
      {mediaItems.map((item, idx) => (
        <GridItem
          key={mediaKey(item)}
          item={item}
          title={title}
          idx={idx}
          priority={!hasColorSlot && idx === 0}
        />
      ))}
    </div>
  );

  return interactive ? <Lightbox label={title}>{grid}</Lightbox> : grid;
}

export function ColorImageGrid({ images, title }: { images: ImageType[]; title: string }) {
  return images.map((image, idx) => (
    <GridItem
      key={image.url}
      item={{ type: "image", image }}
      title={title}
      idx={idx}
      priority={idx === 0}
    />
  ));
}

export function ColorImageCarouselItems({ images, title }: { images: ImageType[]; title: string }) {
  return images.map((image, idx) => (
    <div
      key={image.url}
      className="relative shrink-0 w-full snap-start snap-always overflow-hidden aspect-square"
    >
      <Image
        src={image.url}
        alt={image.altText || `${title} image ${idx + 1}`}
        fill
        className="object-cover"
        sizes="100vw"
        {...(idx === 0 ? LCP_IMAGE_PROPS : LAZY_IMAGE_PROPS)}
        draggable={false}
      />
    </div>
  ));
}

export function ProductMedia({
  otherImages,
  videos,
  title,
  className,
  desktopSlot,
  mobileSlot,
}: {
  otherImages: ImageType[];
  videos: Video[];
  title: string;
  className?: string;
  desktopSlot?: React.ReactNode;
  mobileSlot?: React.ReactNode;
}) {
  const sharedMediaItems: MediaItem[] = [
    ...videos.map((video): MediaItem => ({ type: "video", video })),
    ...otherImages.map((image): MediaItem => ({ type: "image", image })),
  ];

  const hasColorSlot = !!mobileSlot || !!desktopSlot;
  const isEmpty = sharedMediaItems.length === 0 && !hasColorSlot;
  const mediaItems: MediaItem[] = isEmpty ? [{ type: "placeholder" }] : sharedMediaItems;

  return (
    <div className={className}>
      <div className="lg:hidden">
        <Carousel
          key={mediaItems.map(mediaKey).join(",")}
          mediaItems={mediaItems}
          title={title}
          hasColorSlot={hasColorSlot}
        >
          {mobileSlot}
        </Carousel>
      </div>
      <div className="hidden lg:block">
        <Grid
          mediaItems={mediaItems}
          title={title}
          hasColorSlot={hasColorSlot}
          interactive={!isEmpty}
        >
          {desktopSlot}
        </Grid>
      </div>
    </div>
  );
}
