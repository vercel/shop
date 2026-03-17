"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

interface ScrollCarouselContextValue {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  scroll: (direction: "left" | "right") => void;
  handleScroll: () => void;
}

const ScrollCarouselContext = createContext<ScrollCarouselContextValue | null>(null);

function useScrollCarousel() {
  const ctx = useContext(ScrollCarouselContext);
  if (!ctx) {
    throw new Error("ScrollCarousel compound components must be used within <ScrollCarousel>");
  }
  return ctx;
}

function ScrollCarousel({ className, children, ...props }: React.ComponentProps<"section">) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useEffectEvent(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 1);
  });

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, []);

  const scroll = useCallback((direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  return (
    <ScrollCarouselContext.Provider
      value={{
        scrollContainerRef,
        canScrollLeft,
        canScrollRight,
        scroll,
        handleScroll: updateScrollState,
      }}
    >
      <section
        data-slot="scroll-carousel"
        className={cn("overflow-x-clip contain-[paint] py-4", className)}
        {...props}
      >
        <div className="mx-auto min-w-0">{children}</div>
      </section>
    </ScrollCarouselContext.Provider>
  );
}

function ScrollCarouselHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="scroll-carousel-header"
      className={cn("mb-4 flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ScrollCarouselTitle({ className, children, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="scroll-carousel-title"
      className={cn("text-2xl sm:text-3xl font-semibold tracking-tighter", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

function ScrollCarouselNav({ className, ...props }: React.ComponentProps<"div">) {
  const { canScrollLeft, canScrollRight, scroll } = useScrollCarousel();

  // Hide arrows entirely when there aren't enough items to scroll
  if (!canScrollLeft && !canScrollRight) {
    return null;
  }

  return (
    <div data-slot="scroll-carousel-nav" className={cn("flex gap-2", className)} {...props}>
      <button
        type="button"
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        aria-label="Scroll left"
        className="rounded-xl bg-black/10 p-2 backdrop-blur-sm disabled:opacity-30"
      >
        <ChevronLeft className="size-6" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        aria-label="Scroll right"
        className="rounded-xl bg-black/10 p-2 backdrop-blur-sm disabled:opacity-30"
      >
        <ChevronRight className="size-6" aria-hidden="true" />
      </button>
    </div>
  );
}

interface ScrollCarouselContentProps extends React.ComponentProps<"div"> {
  fullBleed?: boolean;
}

function ScrollCarouselContent({
  fullBleed = false,
  className,
  children,
  ...props
}: ScrollCarouselContentProps) {
  const { scrollContainerRef, handleScroll } = useScrollCarousel();

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      data-slot="scroll-carousel-content"
      className={cn(
        "grid grid-flow-col gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scrollbar-hide",
        "lg:auto-cols-[calc((100%-2rem)/3)] xl:auto-cols-[calc((100%-3rem)/4)] 2xl:auto-cols-[calc((100%-4rem)/5)] 3xl:auto-cols-[calc((100%-5rem)/6)] 4xl:auto-cols-[calc((100%-7rem)/8)]",
        fullBleed
          ? "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-none auto-cols-[calc((100vw-3rem)/2)] px-4 scroll-px-4 sm:left-auto sm:right-auto sm:mx-0 sm:w-full sm:max-w-full sm:auto-cols-[calc((100%-1rem)/2)] sm:px-0 sm:scroll-px-0"
          : "w-full auto-cols-[calc((100%-1rem)/2)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function ScrollCarouselItem({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="scroll-carousel-item" className={cn("snap-start", className)} {...props}>
      {children}
    </div>
  );
}

export {
  ScrollCarousel,
  ScrollCarouselContent,
  ScrollCarouselHeader,
  ScrollCarouselItem,
  ScrollCarouselNav,
  ScrollCarouselTitle,
};
