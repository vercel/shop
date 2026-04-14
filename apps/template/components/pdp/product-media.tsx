"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { Image as ImageType, Video } from "@/lib/types";
import { cn } from "@/lib/utils";

import { AutoPlayVideo } from "./auto-play-video";
import { Lightbox, LightboxTrigger } from "./lightbox";

type MediaItem = { type: "video"; video: Video } | { type: "image"; image: ImageType };

function mediaKey(item: MediaItem) {
  return item.type === "video" ? item.video.url : item.image.url;
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
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      draggable={false}
    />
  );
}

function MediaVideo({
  item,
  className,
}: {
  item: Extract<MediaItem, { type: "video" }>;
  className?: string;
}) {
  return (
    <AutoPlayVideo
      src={item.video.url}
      poster={item.video.previewImage?.url}
      className={cn("h-full w-full scale-[1.04] object-cover", className)}
    />
  );
}

/** Snap-scroll carousel for mobile viewports. */
function Carousel({
  mediaItems,
  title,
  children,
}: {
  mediaItems: MediaItem[];
  title: string;
  children?: React.ReactNode;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMediaRef = useRef<string>("");
  const t = useTranslations("product");

  // Reset carousel to first item when the filtered media change
  const joinedKey = mediaItems.map(mediaKey).join(",");
  if (prevMediaRef.current && prevMediaRef.current !== joinedKey) {
    scrollContainerRef.current?.scrollTo({ left: 0 });
    setSelectedIndex(0);
  }
  prevMediaRef.current = joinedKey;

  const scrollToImage = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({
      left: index * container.offsetWidth,
      behavior: "smooth",
    });
    setSelectedIndex(index);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const syncIndex = () => {
      const newIndex = Math.min(
        Math.max(0, Math.round(container.scrollLeft / container.offsetWidth)),
        mediaItems.length - 1,
      );
      setSelectedIndex(newIndex);
    };

    // Sync indicator from actual scroll position on mount / Activity re-activation
    syncIndex();

    container.addEventListener("scroll", syncIndex, { passive: true });
    return () => container.removeEventListener("scroll", syncIndex);
  }, [mediaItems.length]);

  return (
    <div className="space-y-4">
      <div
        ref={scrollContainerRef}
        className="relative overflow-x-auto flex snap-x snap-mandatory overscroll-x-contain scrollbar-hide -mx-4 w-[calc(100%+2rem)]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
        {mediaItems.map((item, idx) => (
          <div
            key={mediaKey(item)}
            className="relative shrink-0 w-full aspect-square snap-start snap-always overflow-hidden"
          >
            {item.type === "video" ? (
              <MediaVideo item={item} />
            ) : (
              <MediaImage
                item={item}
                title={title}
                idx={idx}
                sizes="100vw"
                priority={!children && idx === 0}
              />
            )}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2">
        {mediaItems.map((item, idx) => (
          <button
            type="button"
            key={mediaKey(item)}
            onClick={() => scrollToImage(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === selectedIndex
                ? "bg-foreground w-8"
                : "bg-muted-foreground/30 w-1.5 hover:bg-muted-foreground/50",
            )}
            aria-label={t("goToImage", { number: String(idx + 1) })}
          />
        ))}
      </div>
    </div>
  );
}

/** Single grid item — extracted for reuse. */
function GridItem({ item, title, idx }: { item: MediaItem; title: string; idx: number }) {
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-accent">
      {item.type === "video" ? (
        <MediaVideo item={item} />
      ) : (
        <LightboxTrigger item={item}>
          <MediaImage
            item={item}
            title={title}
            idx={idx}
            sizes="(min-width: 1024px) 25vw, 50vw"
            priority={idx < 2}
          />
        </LightboxTrigger>
      )}
    </div>
  );
}

/** 2-column grid with lightbox for desktop viewports. */
function Grid({
  mediaItems,
  title,
  children,
}: {
  mediaItems: MediaItem[];
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <Lightbox label={title}>
      <div className="grid grid-cols-2 gap-2">
        {children}
        {mediaItems.map((item, idx) => (
          <GridItem key={mediaKey(item)} item={item} title={title} idx={idx} />
        ))}
      </div>
    </Lightbox>
  );
}

/**
 * Renders color-specific images as grid items (desktop).
 * Designed to be used inside a Suspense boundary as children of ProductMedia.
 */
export function ColorImageGrid({ images, title }: { images: ImageType[]; title: string }) {
  return images.map((image, idx) => (
    <GridItem key={image.url} item={{ type: "image", image }} title={title} idx={idx} />
  ));
}

/**
 * Renders color-specific images as carousel items (mobile).
 * Matches the Carousel item structure for consistent snap-scroll behavior.
 */
export function ColorImageCarouselItems({ images, title }: { images: ImageType[]; title: string }) {
  return images.map((image, idx) => (
    <div
      key={image.url}
      className="relative shrink-0 w-full aspect-square snap-start snap-always overflow-hidden"
    >
      <Image
        src={image.url}
        alt={image.altText || `${title} image ${idx + 1}`}
        fill
        className="object-cover"
        sizes="100vw"
        priority={idx === 0}
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
  /** Color images rendered as grid items (desktop). */
  desktopSlot?: React.ReactNode;
  /** Color images rendered as carousel items (mobile). */
  mobileSlot?: React.ReactNode;
}) {
  const sharedMediaItems: MediaItem[] = [
    ...videos.map((video): MediaItem => ({ type: "video", video })),
    ...otherImages.map((image): MediaItem => ({ type: "image", image })),
  ];

  if (sharedMediaItems.length === 0 && !desktopSlot && !mobileSlot) return null;

  return (
    <div className={className}>
      <div className="lg:hidden">
        <Carousel mediaItems={sharedMediaItems} title={title}>
          {mobileSlot}
        </Carousel>
      </div>
      <div className="hidden lg:block">
        <Grid mediaItems={sharedMediaItems} title={title}>
          {desktopSlot}
        </Grid>
      </div>
    </div>
  );
}
