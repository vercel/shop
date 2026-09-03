"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { AutoPlayVideo } from "@/components/ui/auto-play-video";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import type { Image as ImageType, Video } from "@/lib/types";
import { cn } from "@/lib/utils";

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

function MediaImage({
  item,
  title,
  idx,
  sizes,
  fetchPriority,
  className,
}: {
  item: Extract<MediaItem, { type: "image" }>;
  title: string;
  idx: number;
  sizes: string;
  fetchPriority: "auto" | "high";
  className?: string;
}) {
  const blurProps = item.image.blurDataURL
    ? { blurDataURL: item.image.blurDataURL, placeholder: "blur" as const }
    : {};

  return (
    <Image
      src={item.image.url}
      alt={item.image.altText || `${title} image ${idx + 1}`}
      fill
      className={cn("object-cover", className)}
      sizes={sizes}
      fetchPriority={fetchPriority}
      loading="lazy"
      draggable={false}
      {...blurProps}
    />
  );
}

function MediaVideo({
  item,
  sizes,
  fetchPriority,
  className,
}: {
  item: Extract<MediaItem, { type: "video" }>;
  sizes: string;
  fetchPriority: "auto" | "high";
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
      previewImageFetchPriority={fetchPriority}
      previewImageLoading="lazy"
      className={cn("h-full w-full scale-[1.04] object-cover", className)}
    />
  );
}

function Carousel({
  mediaItems,
  title,
  hasColorSlot,
  overlay,
  children,
}: {
  mediaItems: MediaItem[];
  title: string;
  hasColorSlot: boolean;
  overlay?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [itemCount, setItemCount] = useState(mediaItems.length);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const t = useTranslations("product");

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
          const fetchPriority = !hasColorSlot && idx === 0 ? "high" : "auto";
          return (
            <div
              key={mediaKey(item)}
              className="relative shrink-0 w-full snap-start snap-always overflow-hidden aspect-square"
            >
              {item.type === "video" ? (
                <MediaVideo item={item} sizes="100vw" fetchPriority={fetchPriority} />
              ) : item.type === "placeholder" ? (
                <ImagePlaceholder className="size-full" />
              ) : (
                <MediaImage
                  item={item}
                  title={title}
                  idx={idx}
                  sizes="100vw"
                  fetchPriority={fetchPriority}
                />
              )}
              {fetchPriority === "high" && item.type === "image" ? overlay : null}
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
  fetchPriority,
  overlay,
}: {
  item: MediaItem;
  title: string;
  idx: number;
  fetchPriority: "auto" | "high";
  overlay?: React.ReactNode;
}) {
  return (
    <div className="relative w-full overflow-hidden aspect-square">
      {item.type === "video" ? (
        <MediaVideo
          item={item}
          sizes="(min-width: 1024px) 25vw, 50vw"
          fetchPriority={fetchPriority}
        />
      ) : item.type === "placeholder" ? (
        <ImagePlaceholder className="size-full" />
      ) : (
        <LightboxTrigger item={item}>
          <MediaImage
            item={item}
            title={title}
            idx={idx}
            sizes="(min-width: 1024px) 25vw, 50vw"
            fetchPriority={fetchPriority}
          />
        </LightboxTrigger>
      )}
      {fetchPriority === "high" && item.type === "image" ? overlay : null}
    </div>
  );
}

function Grid({
  mediaItems,
  title,
  hasColorSlot,
  overlay,
  children,
}: {
  mediaItems: MediaItem[];
  title: string;
  hasColorSlot: boolean;
  overlay?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {children}
      {mediaItems.map((item, idx) => {
        const fetchPriority = !hasColorSlot && idx === 0 ? "high" : "auto";
        return (
          <GridItem
            key={mediaKey(item)}
            item={item}
            title={title}
            idx={idx}
            fetchPriority={fetchPriority}
            overlay={overlay}
          />
        );
      })}
    </div>
  );
}

export function ColorImageGrid({
  images,
  overlay,
  title,
}: {
  images: ImageType[];
  overlay?: React.ReactNode;
  title: string;
}) {
  return images.map((image, idx) => (
    <GridItem
      key={image.url}
      item={{ type: "image", image }}
      title={title}
      idx={idx}
      fetchPriority={idx === 0 ? "high" : "auto"}
      overlay={overlay}
    />
  ));
}

export function ColorImageCarouselItems({
  images,
  overlay,
  title,
}: {
  images: ImageType[];
  overlay?: React.ReactNode;
  title: string;
}) {
  return images.map((image, idx) => {
    const blurProps = image.blurDataURL
      ? { blurDataURL: image.blurDataURL, placeholder: "blur" as const }
      : {};

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
          fetchPriority={idx === 0 ? "high" : "auto"}
          loading="lazy"
          draggable={false}
          {...blurProps}
        />
        {idx === 0 ? overlay : null}
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
  overlay,
}: {
  otherImages: ImageType[];
  videos: Video[];
  title: string;
  className?: string;
  desktopSlot?: React.ReactNode;
  mobileSlot?: React.ReactNode;
  /** Rendered over the first/primary image cell (e.g. the virtual try-on button). */
  overlay?: React.ReactNode;
}) {
  const sharedMediaItems: MediaItem[] = [
    ...videos.map((video): MediaItem => ({ type: "video", video })),
    ...otherImages.map((image): MediaItem => ({ type: "image", image })),
  ];

  const hasColorSlot = !!mobileSlot || !!desktopSlot;
  const isEmpty = sharedMediaItems.length === 0 && !hasColorSlot;
  const mediaItems: MediaItem[] = isEmpty ? [{ type: "placeholder" }] : sharedMediaItems;

  const content = (
    <div className={className}>
      <div className="lg:hidden">
        <Carousel
          key={mediaItems.map(mediaKey).join(",")}
          mediaItems={mediaItems}
          title={title}
          hasColorSlot={hasColorSlot}
          overlay={overlay}
        >
          {mobileSlot}
        </Carousel>
      </div>
      <div className="hidden lg:block">
        <Grid mediaItems={mediaItems} title={title} hasColorSlot={hasColorSlot} overlay={overlay}>
          {desktopSlot}
        </Grid>
      </div>
    </div>
  );

  return isEmpty ? content : <Lightbox label={title}>{content}</Lightbox>;
}
