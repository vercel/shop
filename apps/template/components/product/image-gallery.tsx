/**
 * Image Gallery Client Component
 *
 * CLIENT COMPONENT - Handles scroll snap gallery with vertical thumbnails
 */

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export function ImageGallery({
  images,
  title,
}: {
  images: Array<{ url: string; altText: string }>;
  title: string;
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("product");
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);

  // Scroll to selected image when clicking thumbnails
  const scrollToImage = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const imageElement = container.children[index] as HTMLElement;
    if (imageElement) {
      imageElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
    setSelectedImageIndex(index);
  };

  const snapToNearestImage = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollPosition = container.scrollLeft;
    const imageWidth = container.offsetWidth;
    const nearestIndex = Math.round(scrollPosition / imageWidth);

    scrollToImage(nearestIndex);
  };

  const applyMomentum = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Apply velocity with friction
    velocityRef.current *= 0.95;
    container.scrollLeft += velocityRef.current;

    // Continue animation if velocity is significant
    if (Math.abs(velocityRef.current) > 0.5) {
      animationRef.current = requestAnimationFrame(applyMomentum);
    } else {
      // Snap to nearest when momentum stops
      snapToNearestImage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Cancel any ongoing momentum animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsDragging(true);
    startXRef.current = e.pageX;
    lastXRef.current = e.pageX;
    scrollLeftRef.current = container.scrollLeft;
    velocityRef.current = 0;
    container.style.cursor = "grabbing";
  };

  const handleMouseLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const container = scrollContainerRef.current;
    if (container) {
      container.style.cursor = "grab";
      // Start momentum animation
      animationRef.current = requestAnimationFrame(applyMomentum);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const container = scrollContainerRef.current;
    if (container) {
      container.style.cursor = "grab";
      // Start momentum animation
      animationRef.current = requestAnimationFrame(applyMomentum);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const container = scrollContainerRef.current;
    if (!container) return;

    const x = e.pageX;
    const delta = x - lastXRef.current;
    const walk = startXRef.current - x;

    // Update velocity for momentum
    velocityRef.current = delta * 0.5;

    // Apply scroll
    container.scrollLeft = scrollLeftRef.current + walk;

    lastXRef.current = x;
  };

  // Update selected image based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollLeft;
      const imageWidth = container.offsetWidth;
      const newIndex = Math.round(scrollPosition / imageWidth);
      setSelectedImageIndex(newIndex);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      // Clean up any ongoing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Vertical thumbnails - Desktop left side, Mobile top
      <div className="flex flex-row lg:flex-col gap-3 order-2 lg:order-1 overflow-x-auto lg:overflow-y-auto lg:max-h-[600px] scrollbar-hide">
        {images.map((image, idx) => (
          <button
            key={image.url}
            type="button"
            onClick={() => scrollToImage(idx)}
            className={`
              relative flex-shrink-0 size-20 aspect-square overflow-hidden rounded-lg border-2 transition-all
              ${
                idx === selectedImageIndex
                  ? "border-foreground"
                  : "border-border hover:border-muted-foreground"
              }
            `}
            aria-label={t("viewImage", {
              current: String(idx + 1),
              total: String(images.length),
            })}
          >
            <Image
              src={image.url}
              alt={image.altText || `${title} image ${idx + 1}`}
              width={80}
              height={80}
              className="object-cover"
              sizes="80px"
            />
          </button>
        ))}
      </div> */}

      {/* Main gallery with scroll snap */}
      <div className="flex-1 order-1 lg:order-2">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: allow drag-to-scroll on the gallery container */}
        <div
          ref={scrollContainerRef}
          className={`relative overflow-x-auto flex gap-0 scrollbar-hide cursor-grab active:cursor-grabbing select-none ${
            isDragging ? "" : "snap-x snap-mandatory"
          }`}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {images.map((image, idx) => (
            <div
              key={image.url}
              className="relative flex-shrink-0 w-full aspect-[3/4] snap-center snap-always overflow-hidden rounded-lg bg-muted border select-none"
            >
              <Image
                src={image.url}
                alt={image.altText || `${title} image ${idx + 1}`}
                fill
                className="object-cover pointer-events-none"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={idx === 0}
                loading={idx === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Image counter indicator */}
        <div className="mt-4 flex justify-center gap-2">
          {images.map((_, idx) => (
            <button
              type="button"
              key={_.url}
              onClick={() => scrollToImage(idx)}
              className={`
                h-1.5 rounded-full transition-all
                ${
                  idx === selectedImageIndex
                    ? "bg-foreground w-8"
                    : "bg-muted-foreground/30 w-1.5 hover:bg-muted-foreground/50"
                }
              `}
              aria-label={t("goToImage", { number: String(idx + 1) })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
