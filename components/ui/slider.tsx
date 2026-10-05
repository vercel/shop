"use client";

import { cn } from "cn";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

interface SliderContextValue {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  handleScroll: () => void;
  registerContainer: (node: HTMLDivElement | null) => void;
  scroll: (direction: "left" | "right") => void;
}

const SliderContext = createContext<SliderContextValue | null>(null);

function useSlider() {
  const context = useContext(SliderContext);
  if (!context) throw new Error("Slider parts must be used within Slider");
  return context;
}

function Slider({ className, children, ...props }: ComponentProps<"section">) {
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

  // Content may mount after the section, so measure from the scroller's own callback ref.
  const registerContainer = useCallback(
    (node: HTMLDivElement | null) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      containerRef.current = node;
      if (!node) return;

      updateScrollState();
      const resizeObserver = new ResizeObserver(updateScrollState);
      resizeObserver.observe(node);
      for (const child of node.children) resizeObserver.observe(child);
      const mutationObserver = new MutationObserver(() => {
        updateScrollState();
        for (const child of node.children) resizeObserver.observe(child);
      });
      mutationObserver.observe(node, { childList: true });
      cleanupRef.current = () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
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
    const visibleItems = Math.max(1, Math.floor(container.clientWidth / itemWidth));
    container.scrollBy({
      behavior: "smooth",
      left: (direction === "left" ? -1 : 1) * itemWidth * visibleItems,
    });
  }, []);

  return (
    <SliderContext.Provider
      value={{
        canScrollLeft,
        canScrollRight,
        handleScroll: updateScrollState,
        registerContainer,
        scroll,
      }}
    >
      <section data-slot="slider" className={cn("grid min-w-0 gap-4", className)} {...props}>
        {children}
      </section>
    </SliderContext.Provider>
  );
}

function SliderHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="slider-header"
      className={cn("flex items-center justify-between", className)}
      {...props}
    />
  );
}

function SliderNav({ className, ...props }: ComponentProps<"div">) {
  const { canScrollLeft, canScrollRight, scroll } = useSlider();
  const hidden = !canScrollLeft && !canScrollRight;
  return (
    <div
      data-slot="slider-nav"
      className={cn("flex items-center gap-1", hidden && "invisible", className)}
      {...props}
    >
      <button
        aria-label="Scroll left"
        className="cursor-pointer text-foreground transition-colors disabled:cursor-not-allowed disabled:text-foreground/30"
        disabled={!canScrollLeft}
        onClick={() => scroll("left")}
        type="button"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-5" />
      </button>
      <button
        aria-label="Scroll right"
        className="cursor-pointer text-foreground transition-colors disabled:cursor-not-allowed disabled:text-foreground/30"
        disabled={!canScrollRight}
        onClick={() => scroll("right")}
        type="button"
      >
        <ChevronRightIcon aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}

function SliderContent({ className, ...props }: ComponentProps<"div">) {
  const { handleScroll, registerContainer } = useSlider();
  return (
    <div
      ref={registerContainer}
      data-slot="slider-content"
      onScroll={handleScroll}
      className={cn(
        "scrollbar-hide grid snap-x snap-mandatory grid-flow-col gap-5 overflow-x-auto overscroll-x-contain",
        className,
      )}
      style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      {...props}
    />
  );
}

function SliderItem({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="slider-item" className={cn("snap-start", className)} {...props} />;
}

export { Slider, SliderContent, SliderHeader, SliderItem, SliderNav };
