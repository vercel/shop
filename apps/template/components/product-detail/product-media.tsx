"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { Image as ImageType, Video } from "@/lib/types";
import { cn } from "@/lib/utils";

import { AutoPlayVideo } from "./auto-play-video";
import { Lightbox, LightboxTrigger } from "./lightbox";

export type MediaItem = { type: "video"; video: Video } | { type: "image"; image: ImageType };

function mediaKey(item: MediaItem) {
  return item.type === "video" ? item.video.url : item.image.url;
}

function mediaPreviewUrl(item: MediaItem) {
  return item.type === "video" ? (item.video.previewImage?.url ?? "") : item.image.url;
}

function mediaAlt(item: MediaItem, title: string, idx: number) {
  if (item.type === "video") return item.video.previewImage?.altText || `${title} video ${idx + 1}`;
  return item.image.altText || `${title} image ${idx + 1}`;
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
      previewImage={item.video.previewImage}
      sizes={sizes}
      priorityImage={priority}
      className={cn("h-full w-full scale-[1.04] object-cover", className)}
    />
  );
}

function Carousel({ mediaItems, title }: { mediaItems: MediaItem[]; title: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMediaRef = useRef<string>("");
  const t = useTranslations("product");

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

    syncIndex();

    container.addEventListener("scroll", syncIndex, { passive: true });
    return () => container.removeEventListener("scroll", syncIndex);
  }, [mediaItems.length]);

  return (
    <div className="grid gap-5">
      <div
        ref={scrollContainerRef}
        className="relative overflow-x-auto flex snap-x snap-mandatory overscroll-x-contain scrollbar-hide -mx-5 w-[calc(100%+2.5rem)]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {mediaItems.map((item, idx) => (
          <div
            key={mediaKey(item)}
            className="relative shrink-0 w-full aspect-square snap-start snap-always overflow-hidden"
          >
            {item.type === "video" ? (
              <MediaVideo item={item} sizes="100vw" priority={idx === 0} />
            ) : (
              <MediaImage item={item} title={title} idx={idx} sizes="100vw" priority={idx === 0} />
            )}
          </div>
        ))}
      </div>

      <div className={cn("flex justify-center gap-2", mediaItems.length <= 1 && "invisible")}>
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

function Gallery({ mediaItems, title }: { mediaItems: MediaItem[]; title: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const prevMediaRef = useRef<string>("");

  const joinedKey = mediaItems.map(mediaKey).join(",");
  if (prevMediaRef.current && prevMediaRef.current !== joinedKey) {
    setSelectedIndex(0);
  }
  prevMediaRef.current = joinedKey;

  const safeIndex = Math.min(selectedIndex, Math.max(0, mediaItems.length - 1));
  const selected = mediaItems[safeIndex];
  const t = useTranslations("product");

  return (
    <div className="flex gap-2.5">
      <div className="flex flex-col gap-2.5 w-20 shrink-0">
        {mediaItems.map((item, idx) => {
          const isSelected = idx === safeIndex;
          return (
            <button
              type="button"
              key={mediaKey(item)}
              onClick={() => setSelectedIndex(idx)}
              aria-label={t("goToImage", { number: String(idx + 1) })}
              aria-current={isSelected ? "true" : undefined}
              className={cn(
                "relative aspect-square w-full overflow-hidden bg-accent transition-all",
                isSelected
                  ? "ring-1 ring-inset ring-foreground/50"
                  : "ring-1 ring-inset ring-transparent hover:opacity-80",
              )}
            >
              <Image
                src={mediaPreviewUrl(item)}
                alt={mediaAlt(item, title, idx)}
                fill
                className="object-cover"
                sizes="80px"
                draggable={false}
              />
            </button>
          );
        })}
      </div>
      <div className="relative aspect-square flex-1 overflow-hidden bg-accent">
        {selected &&
          (selected.type === "video" ? (
            <MediaVideo item={selected} sizes="(min-width: 1024px) 50vw, 100vw" priority />
          ) : (
            <LightboxTrigger item={selected}>
              <MediaImage
                item={selected}
                title={title}
                idx={safeIndex}
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
              />
            </LightboxTrigger>
          ))}
      </div>
    </div>
  );
}

export function ProductMedia({
  mediaItems,
  title,
  className,
}: {
  mediaItems: MediaItem[];
  title: string;
  className?: string;
}) {
  if (mediaItems.length === 0) return null;

  return (
    <div className={className}>
      <div className="lg:hidden">
        <Carousel mediaItems={mediaItems} title={title} />
      </div>
      <div className="hidden lg:block">
        <Lightbox label={title}>
          <Gallery mediaItems={mediaItems} title={title} />
        </Lightbox>
      </div>
    </div>
  );
}
