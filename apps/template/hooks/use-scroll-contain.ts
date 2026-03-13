import { type RefObject, useEffect, useEffectEvent, useRef } from "react";

function isAtScrollBoundary(el: HTMLElement, deltaY: number) {
  const { scrollTop, scrollHeight, clientHeight } = el;
  if (deltaY < 0) return scrollTop <= 0;
  if (deltaY > 0) return Math.ceil(scrollTop + clientHeight) >= scrollHeight;
  return false;
}

/**
 * Prevents scroll events (wheel + touch) from propagating through a panel
 * to the page behind it, while still allowing a designated scrollable child
 * to scroll normally within its bounds.
 */
export function useScrollContain(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  scrollSelector = "[data-slot=messages]",
) {
  const touchStartYRef = useRef(0);

  const onWheel = useEffectEvent((e: WheelEvent) => {
    const panel = ref.current;
    if (!panel) return;

    const scrollEl = panel.querySelector<HTMLElement>(scrollSelector);
    if (
      scrollEl?.contains(e.target as Node) &&
      !isAtScrollBoundary(scrollEl, e.deltaY)
    ) {
      return;
    }
    e.preventDefault();
  });

  const onTouchStart = useEffectEvent((e: TouchEvent) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? 0;
  });

  const onTouchMove = useEffectEvent((e: TouchEvent) => {
    const panel = ref.current;
    if (!panel) return;

    const deltaY = touchStartYRef.current - (e.touches[0]?.clientY ?? 0);
    const scrollEl = panel.querySelector<HTMLElement>(scrollSelector);
    if (
      scrollEl?.contains(e.target as Node) &&
      !isAtScrollBoundary(scrollEl, deltaY)
    ) {
      return;
    }
    e.preventDefault();
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: ref is stable; enabled changing to true coincides with the panel mounting
  useEffect(() => {
    if (!enabled) return;
    const panel = ref.current;
    if (!panel) return;

    panel.addEventListener("wheel", onWheel, { passive: false });
    panel.addEventListener("touchstart", onTouchStart, { passive: true });
    panel.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      panel.removeEventListener("wheel", onWheel);
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchmove", onTouchMove);
    };
  }, [enabled]);
}
