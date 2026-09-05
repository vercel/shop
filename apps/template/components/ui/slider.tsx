"use client";

import { cn } from "cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import { createContext, useCallback, useContext, useRef, useState } from "react";

interface SliderContextValue {
  registerContainer: (node: HTMLDivElement | null) => void;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  scroll: (direction: "left" | "right") => void;
  handleScroll: () => void;
}

const SliderContext = createContext<SliderContextValue | null>(null);

function useSlider() {
  const ctx = useContext(SliderContext);
  if (!ctx) {
    throw new Error("Slider compound components must be used within <Slider>");
  }
  return ctx;
}

function Slider({ className, children, ...props }: React.ComponentProps<"section">) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 1);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 1);
  }, []);

  // The scroller mounts as a sibling that streams in via Suspense, so a mount effect on
  // this parent runs while the ref is still null. Attach measurement from the scroller's
  // own callback ref instead, then keep it current on scroll, resize, and child changes.
  const registerContainer = useCallback(
    (node: HTMLDivElement | null) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      containerRef.current = node;
      if (!node) return;

      updateScrollState();

      const resizeObserver = new ResizeObserver(updateScrollState);
      resizeObserver.observe(node);
      for (const child of Array.from(node.children)) {
        resizeObserver.observe(child);
      }

      const mutationObserver = new MutationObserver(() => {
        updateScrollState();
        for (const child of Array.from(node.children)) {
          resizeObserver.observe(child);
        }
      });
      mutationObserver.observe(node, { childList: true });

      window.addEventListener("resize", updateScrollState);
      cleanupRef.current = () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        window.removeEventListener("resize", updateScrollState);
      };
    },
    [updateScrollState],
  );

  const scroll = useCallback((direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;
    const firstItem = container.querySelector<HTMLElement>("[data-slot='slider-item']");
    const gap = Number.parseFloat(getComputedStyle(container).columnGap) || 0;
    const itemWidth = firstItem ? firstItem.offsetWidth + gap : container.clientWidth * 0.8;
    const visibleItems = Math.floor(container.clientWidth / itemWidth);
    const scrollAmount = itemWidth * Math.max(visibleItems, 1);
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  return (
    <SliderContext.Provider
      value={{
        registerContainer,
        canScrollLeft,
        canScrollRight,
        scroll,
        handleScroll: updateScrollState,
      }}
    >
      <section
        data-slot="slider"
        className={cn("sm:overflow-x-clip sm:contain-[paint]", className)}
        {...props}
      >
        <div className="mx-auto min-w-0">{children}</div>
      </section>
    </SliderContext.Provider>
  );
}

function SliderHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="slider-header"
      className={cn("mb-4 flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function SliderTitle({ className, children, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="slider-title"
      className={cn("text-2xl sm:text-3xl font-semibold tracking-tighter", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

function SliderNav({ className, ...props }: React.ComponentProps<"div">) {
  const { canScrollLeft, canScrollRight, scroll } = useSlider();
  const hidden = !canScrollLeft && !canScrollRight;

  return (
    <div
      data-slot="slider-nav"
      className={cn("hidden lg:flex items-center gap-1", hidden && "lg:invisible", className)}
      {...props}
    >
      <button
        type="button"
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        aria-label="Scroll left"
        className="text-foreground disabled:text-foreground/30"
      >
        <ChevronLeft className="size-6" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        aria-label="Scroll right"
        className="text-foreground disabled:text-foreground/30"
      >
        <ChevronRight className="size-6" aria-hidden="true" />
      </button>
    </div>
  );
}

function SliderContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { registerContainer, handleScroll } = useSlider();

  return (
    <div
      ref={registerContainer}
      onScroll={handleScroll}
      data-slot="slider-content"
      className={cn(
        "grid grid-flow-col gap-5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scrollbar-hide",
        "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-none auto-cols-[58.33vw] px-5 scroll-px-5",
        "sm:left-auto sm:right-auto sm:mx-0 sm:w-full sm:max-w-full sm:auto-cols-[calc((100%-1.25rem)/2)] sm:px-0 sm:scroll-px-0",
        "lg:auto-cols-[calc((100%-2.5rem)/3)] xl:auto-cols-[calc((100%-3.75rem)/4)] 2xl:auto-cols-[calc((100%-5rem)/5)] 3xl:auto-cols-[calc((100%-6.25rem)/6)] 4xl:auto-cols-[calc((100%-8.75rem)/8)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function SliderItem({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="slider-item" className={cn("snap-start", className)} {...props}>
      {children}
    </div>
  );
}

export { Slider, SliderContent, SliderHeader, SliderItem, SliderNav, SliderTitle };
