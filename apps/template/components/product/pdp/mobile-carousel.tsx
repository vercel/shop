"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { Image as ImageType, Video } from "@/lib/types";
import { cn } from "@/lib/utils";

import { AutoPlayVideo } from "./auto-play-video";

export function MobileCarousel({
  images,
  videos,
  title,
}: {
  images: ImageType[];
  videos: Video[];
  title: string;
}) {
  type MediaItem = { type: "video"; video: Video } | { type: "image"; image: ImageType };

  const mediaItems: MediaItem[] = [
    ...videos.map((video): MediaItem => ({ type: "video", video })),
    ...images.map((image): MediaItem => ({ type: "image", image })),
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMediaRef = useRef<string>("");
  const t = useTranslations("product");

  // Reset carousel to first item when the filtered media change
  const mediaKey = mediaItems
    .map((m) => (m.type === "video" ? m.video.url : m.image.url))
    .join(",");
  if (prevMediaRef.current && prevMediaRef.current !== mediaKey) {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ left: 0 });
    }
    setSelectedIndex(0);
  }
  prevMediaRef.current = mediaKey;

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

    const handleScroll = () => {
      const scrollPosition = container.scrollLeft;
      const imageWidth = container.offsetWidth;
      const newIndex = Math.min(
        Math.max(0, Math.round(scrollPosition / imageWidth)),
        mediaItems.length - 1,
      );
      setSelectedIndex(newIndex);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [mediaItems.length]);

  if (mediaItems.length === 0) return null;

  return (
    <div className="space-y-4">
      <div
        ref={scrollContainerRef}
        className="relative overflow-x-auto flex snap-x snap-mandatory overscroll-x-contain scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {mediaItems.map((item, idx) => (
          <div
            key={item.type === "video" ? item.video.url : item.image.url}
            className="relative flex-shrink-0 w-full aspect-square snap-start snap-always overflow-hidden bg-accent"
          >
            {item.type === "video" ? (
              <AutoPlayVideo
                src={item.video.url}
                poster={item.video.previewImage?.url}
                className="h-full w-full scale-105 object-cover rounded-xl"
              />
            ) : (
              <Image
                src={item.image.url}
                alt={item.image.altText || `${title} image ${idx + 1}`}
                fill
                className="object-cover rounded-xl"
                sizes="calc(100vw - 2rem)"
                priority={idx === 0}
                loading={idx === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            )}
          </div>
        ))}
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2">
        {mediaItems.map((item, idx) => (
          <button
            type="button"
            key={item.type === "video" ? item.video.url : item.image.url}
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
