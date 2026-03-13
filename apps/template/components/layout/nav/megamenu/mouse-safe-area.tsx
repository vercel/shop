"use client";

import { type RefObject, useEffect, useRef } from "react";

type Props = {
  parentRef: RefObject<HTMLDivElement | null>;
};

export function MouseSafeArea({ parentRef }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rect: DOMRect | null = null;

    function updateRect() {
      rect = parentRef.current?.getBoundingClientRect() ?? null;
    }

    function handleMouseMove(e: MouseEvent) {
      const el = ref.current;
      if (!el || !rect) return;

      if (e.clientX >= rect.x) {
        el.style.display = "none";
        return;
      }

      const offset = e.clientX - rect.x;
      const mouseYPercent = ((e.clientY - rect.y) / rect.height) * 100;

      el.style.display = "";
      el.style.left = `${offset}px`;
      el.style.width = `${-offset}px`;
      el.style.height = `${rect.height}px`;
      el.style.clipPath = `polygon(100% 0%, 0% ${mouseYPercent}%, 100% 100%)`;
    }

    updateRect();
    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", updateRect);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", updateRect);
    };
  }, [parentRef]);

  return (
    <div
      ref={ref}
      aria-hidden
      style={{ position: "absolute", top: 0, zIndex: 10, display: "none" }}
    />
  );
}
