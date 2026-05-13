"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { AutoPlayVideo } from "@/components/ui/auto-play-video";
import type { Image as ImageType, Video } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  eager,
  className,
}: {
  item: Extract<MediaItem, { type: "image" }>;
  title: string;
  idx: number;
  sizes: string;
  priority: boolean;
  eager: boolean;
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
      loading={priority || eager ? "eager" : "lazy"}
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
      priorityImage={priority}
      className={cn("h-full w-full scale-[1.04] object-cover", className)}
    />
  );
}

/** Snap-scroll carousel for mobile viewports. */
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

    // Variant/video items arrive via slot children, so count the rendered DOM, not just mediaItems.
    const sync = () => {
      const width = container.offsetWidth;
      if (width === 0) return;
      const total = Math.max(1, container.children.length);
      const newIndex = Math.min(Math.max(0, Math.round(container.scrollLeft / width)), total - 1);
      setItemCount(total);
      setSelectedIndex(newIndex);
    };

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
  }, []);

  return (
    <div className="grid gap-5">
      <div
        ref={scrollContainerRef}
        className="relative overflow-x-auto flex snap-x snap-mandatory overscroll-x-contain scrollbar-hide -mx-5 w-[calc(100%+2.5rem)]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
        {mediaItems.map((item, idx) => {
          const priority = !hasColorSlot && idx === 0;
          const eager = hasColorSlot ? idx === 0 : idx === 1;
          return (
            <div
              key={mediaKey(item)}
              className="relative shrink-0 w-full snap-start snap-always overflow-hidden aspect-square"
            >
              {item.type === "video" ? (
                <MediaVideo item={item} sizes="100vw" priority={priority || eager} />
              ) : (
                <MediaImage
                  item={item}
                  title={title}
                  idx={idx}
                  sizes="100vw"
                  priority={priority}
                  eager={eager}
                />
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
            aria-label={t("goToImage", { number: String(idx + 1) })}
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
  eager,
}: {
  item: MediaItem;
  title: string;
  idx: number;
  priority: boolean;
  eager: boolean;
}) {
  return (
    <div className="relative w-full overflow-hidden bg-accent aspect-square">
      {item.type === "video" ? (
        <MediaVideo
          item={item}
          sizes="(min-width: 1024px) 25vw, 50vw"
          priority={priority || eager}
        />
      ) : (
        <LightboxTrigger item={item}>
          <MediaImage
            item={item}
            title={title}
            idx={idx}
            sizes="(min-width: 1024px) 25vw, 50vw"
            priority={priority}
            eager={eager}
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
  hasColorSlot,
  children,
}: {
  mediaItems: MediaItem[];
  title: string;
  hasColorSlot: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Lightbox label={title}>
      <div className="grid grid-cols-2 gap-2.5">
        {children}
        {mediaItems.map((item, idx) => {
          const priority = !hasColorSlot && idx === 0;
          const eager = hasColorSlot ? idx === 0 : idx === 1;
          return (
            <GridItem
              key={mediaKey(item)}
              item={item}
              title={title}
              idx={idx}
              priority={priority}
              eager={eager}
            />
          );
        })}
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
    <GridItem
      key={image.url}
      item={{ type: "image", image }}
      title={title}
      idx={idx}
      priority={idx === 0}
      eager={idx === 1}
    />
  ));
}

/**
 * Renders color-specific images as carousel items (mobile).
 * Matches the Carousel item structure for consistent snap-scroll behavior.
 */
export function ColorImageCarouselItems({ images, title }: { images: ImageType[]; title: string }) {
  return images.map((image, idx) => {
    const priority = idx === 0;
    const eager = idx === 1;
    return (
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
          priority={priority}
          loading={priority || eager ? "eager" : "lazy"}
          draggable={false}
        />
      </div>
    );
  });
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

  const hasColorSlot = !!mobileSlot || !!desktopSlot;

  return (
    <div className={className}>
      <div className="lg:hidden">
        <Carousel mediaItems={sharedMediaItems} title={title} hasColorSlot={hasColorSlot}>
          {mobileSlot}
        </Carousel>
      </div>
      <div className="hidden lg:block">
        <Grid mediaItems={sharedMediaItems} title={title} hasColorSlot={hasColorSlot}>
          {desktopSlot}
        </Grid>
      </div>
    </div>
  );
}
