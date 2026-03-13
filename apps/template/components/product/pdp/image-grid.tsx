"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type {
  Image as ImageType,
  ProductOption,
  ProductVariant,
  Video,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { AutoPlayVideo } from "./auto-play-video";
import { usePdpVariantState } from "./variant-state";
import { getImagesForSelectedColor } from "./variants";

type MediaItem =
  | { type: "video"; video: Video }
  | { type: "image"; image: ImageType };

function ImageViewer({
  images,
  videos,
  title,
}: {
  images: ImageType[];
  videos: Video[];
  title: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const prevMediaRef = useRef<string>("");

  const mediaItems: MediaItem[] = [
    ...images.map((image): MediaItem => ({ type: "image", image })),
    ...videos.map((video): MediaItem => ({ type: "video", video })),
  ];

  // Reset to first item when filtered media changes (e.g. color switch)
  const mediaKey = mediaItems
    .map((m) => (m.type === "video" ? m.video.url : m.image.url))
    .join(",");
  if (prevMediaRef.current && prevMediaRef.current !== mediaKey) {
    setSelectedIndex(0);
  }
  prevMediaRef.current = mediaKey;

  if (mediaItems.length === 0) return null;

  const selected = mediaItems[selectedIndex] ?? mediaItems[0];

  return (
    <div className="flex gap-3">
      {/* Thumbnail column */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-200px)] w-20 shrink-0">
        {mediaItems.map((item, idx) => {
          const key = item.type === "video" ? item.video.url : item.image.url;
          return (
            <button
              type="button"
              key={key}
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "relative aspect-square w-full overflow-hidden rounded-lg bg-accent transition-all ring-1 ring-inset",
                idx === selectedIndex
                  ? "ring-foreground/50"
                  : "ring-transparent hover:ring-foreground/50",
              )}
            >
              {item.type === "video" ? (
                <Image
                  src={item.video.previewImage?.url ?? ""}
                  alt={`${title} video ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <Image
                  src={item.image.url}
                  alt={item.image.altText || `${title} image ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-accent">
        {selected?.type === "video" ? (
          <AutoPlayVideo
            src={selected.video.url}
            poster={selected.video.previewImage?.url}
            className="h-full w-full scale-105 object-cover rounded-xl"
          />
        ) : selected ? (
          <Image
            src={selected.image.url}
            alt={
              selected.image.altText || `${title} image ${selectedIndex + 1}`
            }
            fill
            className="object-cover rounded-xl"
            sizes="(min-width: 1024px) 45vw, 100vw"
            priority={selectedIndex === 0}
            loading={selectedIndex === 0 ? "eager" : "lazy"}
          />
        ) : null}
      </div>
    </div>
  );
}

// TODO: Skill
export function ImageGrid({
  images,
  videos,
  title,
  options,
  variants,
}: {
  images: ImageType[];
  videos: Video[];
  title: string;
  options: ProductOption[];
  variants: ProductVariant[];
}) {
  const { selectedOptions } = usePdpVariantState();
  const filteredImages = getImagesForSelectedColor(
    images,
    options,
    variants,
    selectedOptions,
  );

  return <ImageViewer images={filteredImages} videos={videos} title={title} />;
}
