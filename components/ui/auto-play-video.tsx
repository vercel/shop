"use client";

import { cn } from "cn";
import { PauseIcon, PlayIcon } from "lucide-react";
import Image from "next/image";
import { type ComponentProps, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface AutoPlayVideoPreviewImage {
  src: string;
  alt: string;
}

interface AutoPlayVideoProps extends Omit<
  ComponentProps<"video">,
  "autoPlay" | "loop" | "muted" | "onCanPlay" | "playsInline" | "ref"
> {
  previewImage?: AutoPlayVideoPreviewImage | null;
  previewImageFetchPriority?: "auto" | "high" | "low";
  previewImageLoading?: "eager" | "lazy";
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function AutoPlayVideo({
  previewImage,
  previewImageFetchPriority,
  previewImageLoading,
  className,
  ...props
}: AutoPlayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [playRequested, setPlayRequested] = useState<boolean>();
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    () => false,
  );
  const playing = playRequested ?? !reducedMotion;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (!playing) {
      el.pause();
      return;
    }

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
  }, [playing]);

  return (
    <>
      {previewImage && !videoReady && (
        <Image
          src={previewImage.src}
          alt={previewImage.alt}
          fill
          className={cn("object-cover", className)}
          sizes="100vw"
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
      <button
        type="button"
        aria-label={playing ? "Pause video" : "Play video"}
        className="absolute right-2.5 bottom-2.5 flex size-8 cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => setPlayRequested(!playing)}
      >
        {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
      </button>
    </>
  );
}
