"use client";

import { type ComponentPropsWithoutRef, useEffect, useRef } from "react";

type AutoPlayVideoProps = Omit<
  ComponentPropsWithoutRef<"video">,
  "autoPlay" | "ref"
>;

/**
 * A video element that autoplays when visible and pauses when off-screen.
 * Uses IntersectionObserver instead of a one-shot `play()` call so the video
 * reliably restarts after scrolling back into view (desktop grid) or swiping
 * back in a carousel (mobile), and retries on mobile browsers that may block
 * the initial autoplay attempt.
 */
export function AutoPlayVideo(props: AutoPlayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

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

  return <video ref={videoRef} muted loop playsInline {...props} />;
}
