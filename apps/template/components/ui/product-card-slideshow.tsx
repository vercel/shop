"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface ProductCardSlideshowProps {
  images: Array<{ url: string; altText: string; width: number; height: number }>;
  sizes?: string;
  className?: string;
}

export function ProductCardSlideshow({
  images,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw",
  className,
}: ProductCardSlideshowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Skip the first image (featured) — slideshow starts at image 2
  const slideshowImages = images.slice(1);
  const count = slideshowImages.length;

  const scrollTo = useCallback(
    (index: number) => {
      const container = scrollRef.current;
      if (!container) return;
      const clamped = Math.max(0, Math.min(index, count - 1));
      container.scrollTo({ left: clamped * container.offsetWidth, behavior: "smooth" });
      setCurrentIndex(clamped);
    },
    [count],
  );

  const handlePrev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      scrollTo(currentIndex - 1);
    },
    [currentIndex, scrollTo],
  );

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      scrollTo(currentIndex + 1);
    },
    [currentIndex, scrollTo],
  );

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || container.offsetWidth === 0) return;
    const index = Math.round(container.scrollLeft / container.offsetWidth);
    setCurrentIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ left: 0 });
    setCurrentIndex(0);
  }, []);

  if (count === 0) return null;

  return (
    <div
      data-slot="product-card-slideshow"
      onMouseLeave={handleMouseLeave}
      className={cn(
        "absolute inset-0 opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-200",
        className,
      )}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {slideshowImages.map((image, i) => (
          <div key={image.url} className="relative w-full h-full shrink-0 snap-start snap-always">
            <Image
              src={image.url}
              alt={image.altText || ""}
              fill
              className="object-cover"
              sizes={sizes}
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* Chevron arrows — onMouseDown prevents parent link navigation */}
      <button
        type="button"
        onClick={handlePrev}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label="Previous image"
        className={cn(
          "absolute left-1.5 top-1/2 -translate-y-1/2 z-[5]",
          "flex items-center justify-center size-7 rounded-full",
          "bg-white/80 backdrop-blur-sm shadow-sm border border-black/5",
          "hover:bg-white hover:scale-110",
          "transition-all duration-150",
          "cursor-pointer",
          currentIndex === 0 && "invisible",
        )}
      >
        <ChevronLeft className="size-4 text-neutral-700" />
      </button>
      <button
        type="button"
        onClick={handleNext}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label="Next image"
        className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2 z-[5]",
          "flex items-center justify-center size-7 rounded-full",
          "bg-white/80 backdrop-blur-sm shadow-sm border border-black/5",
          "hover:bg-white hover:scale-110",
          "transition-all duration-150",
          "cursor-pointer",
          currentIndex >= count - 1 && "invisible",
        )}
      >
        <ChevronRight className="size-4 text-neutral-700" />
      </button>

      {/* Dot indicators */}
      {count > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[5] flex gap-1">
          {slideshowImages.map((image, i) => (
            <span
              key={image.url}
              className={cn(
                "size-1.5 rounded-full transition-colors duration-150",
                i === currentIndex ? "bg-white" : "bg-white/50",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
