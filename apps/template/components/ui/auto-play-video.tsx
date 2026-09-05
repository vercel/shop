"use client";

import Image from "next/image";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface AutoPlayVideoPreviewImage {
  src: string;
  alt: string;
}

interface AutoPlayVideoProps extends Omit<
  React.ComponentProps<"video">,
  "autoPlay" | "loop" | "muted" | "onCanPlay" | "playsInline" | "ref"
> {
  previewImage?: AutoPlayVideoPreviewImage | null;
  previewImageFetchPriority?: "auto" | "high" | "low";
  previewImageLoading?: "eager" | "lazy";
  sizes?: string;
}
export function AutoPlayVideo({
  previewImage,
  previewImageFetchPriority,
  previewImageLoading,
  sizes,
  className,
  ...props
}: AutoPlayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {previewImage && !videoReady && (
        <Image
          src={previewImage.src}
          alt={previewImage.alt}
          fill
          className={cn("object-cover", className)}
          sizes={sizes}
          fetchPriority={previewImageFetchPriority}
          loading={previewImageLoading}
          draggable={false}
        />
      )}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        onCanPlay={() => setVideoReady(true)}
        className={cn(className, !videoReady && "opacity-0")}
        {...props}
      />
    </>
  );
}
