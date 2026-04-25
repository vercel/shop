"use client";

import Image from "next/image";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";

import type { Image as ImageType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AutoPlayVideoProps extends Omit<React.ComponentProps<"video">, "autoPlay" | "ref"> {
  previewImage?: ImageType | null;
  sizes?: string;
  priorityImage?: boolean;
}

/**
 * A video element that autoplays when visible and pauses when off-screen.
 * Uses IntersectionObserver instead of a one-shot `play()` call so the video
 * reliably restarts after scrolling back into view (desktop grid) or swiping
 * back in a carousel (mobile), and retries on mobile browsers that may block
 * the initial autoplay attempt.
 *
 * When a `previewImage` is provided, a next/image is rendered underneath the
 * video and stays visible until the video fires `canplay`.
 */
export function AutoPlayVideo({
  previewImage,
  sizes,
  priorityImage,
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
          src={previewImage.url}
          alt={previewImage.altText || ""}
          fill
          className={cn("object-cover", className)}
          sizes={sizes}
          priority={priorityImage}
          loading={priorityImage ? "eager" : "lazy"}
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
