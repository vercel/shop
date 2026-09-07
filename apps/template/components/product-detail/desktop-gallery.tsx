"use client";

import { PlayIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image, { getImageProps } from "next/image";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { preload } from "react-dom";

import { AutoPlayVideo } from "@/components/ui/auto-play-video";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import type { Image as ImageType, Video } from "@/lib/media/types";

import { LightboxTrigger } from "./lightbox";

const IMAGE_SIZES = "(min-width: 1536px) 696px, (min-width: 1024px) calc(60vw - 226px), 100vw";

type GalleryItem = { image: ImageType; type: "image" } | { type: "video"; video: Video };

interface DesktopGalleryProps {
  images: ImageType[];
  overlay?: ReactNode;
  title: string;
  videos: Video[];
}

export function DesktopGallery({ images, overlay, title, videos }: DesktopGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("product");

  // Activity keeps state on navigation but runs layout-effect cleanup when hiding the gallery.
  useLayoutEffect(() => {
    const thumbnails = thumbnailsRef.current;
    return () => {
      setSelectedIndex(0);
      if (thumbnails) thumbnails.scrollTop = 0;
    };
  }, []);
  const items: GalleryItem[] = [
    ...images.map((image): GalleryItem => ({ image, type: "image" })),
    ...videos.map((video): GalleryItem => ({ type: "video", video })),
  ];
  const activeIndex = Math.min(selectedIndex, Math.max(0, items.length - 1));
  const activeItem = items[activeIndex];
  const firstImage = images[0];

  // Scope the hero preload to desktop so the hidden gallery doesn't compete with the mobile carousel.
  if (firstImage) {
    const { props } = getImageProps({
      alt: "",
      fill: true,
      sizes: IMAGE_SIZES,
      src: firstImage.url,
    });
    preload(props.src, {
      as: "image",
      fetchPriority: "high",
      imageSizes: props.sizes,
      imageSrcSet: props.srcSet,
      media: "(min-width: 1024px)",
    });
  }

  return (
    <div
      className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-2.5 pr-20"
      data-pdp-gallery="enabled"
    >
      <div className="relative h-full min-h-0">
        <div
          ref={thumbnailsRef}
          className="absolute inset-0 flex flex-col gap-2.5 overflow-y-auto overscroll-contain"
        >
          {items.map((item, index) => {
            const image = item.type === "image" ? item.image : item.video.previewImage;
            return (
              <button
                key={item.type === "image" ? item.image.url : item.video.url}
                aria-label={t("goToImage", { number: String(index + 1) })}
                aria-pressed={index === activeIndex}
                className="relative aspect-square w-full shrink-0 cursor-pointer overflow-hidden outline-none after:pointer-events-none after:absolute after:inset-0 after:border-2 after:border-transparent hover:after:border-muted-foreground focus-visible:after:border-foreground data-[active=true]:after:border-foreground"
                data-active={index === activeIndex}
                onClick={() => setSelectedIndex(index)}
                type="button"
              >
                <span className="relative block size-full">
                  {image ? (
                    <Image alt="" className="object-cover" fill sizes="80px" src={image.url} />
                  ) : (
                    <ImagePlaceholder className="size-full" />
                  )}
                </span>
                {item.type === "video" ? (
                  <PlayIcon
                    aria-hidden
                    className="absolute bottom-2 right-2 size-4 fill-background"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <div
        className="relative aspect-square min-w-0 overflow-hidden"
        data-slot="gallery-active-media"
      >
        {activeItem?.type === "image" ? (
          <>
            <LightboxTrigger item={activeItem}>
              <Image
                key={activeItem.image.url}
                alt={activeItem.image.altText || title}
                blurDataURL={activeItem.image.blurDataURL}
                className="object-contain"
                draggable={false}
                fetchPriority={activeIndex === 0 ? "high" : "auto"}
                fill
                placeholder={activeItem.image.blurDataURL ? "blur" : "empty"}
                sizes={IMAGE_SIZES}
                src={activeItem.image.url}
              />
            </LightboxTrigger>
            {activeIndex === 0 ? overlay : null}
          </>
        ) : activeItem?.type === "video" ? (
          <AutoPlayVideo
            key={activeItem.video.url}
            className="size-full object-contain"
            previewImage={
              activeItem.video.previewImage
                ? {
                    alt: activeItem.video.previewImage.altText || title,
                    src: activeItem.video.previewImage.url,
                  }
                : null
            }
            previewImageLoading="lazy"
            sizes={IMAGE_SIZES}
            src={activeItem.video.url}
          />
        ) : (
          <ImagePlaceholder className="size-full" />
        )}
      </div>
    </div>
  );
}
