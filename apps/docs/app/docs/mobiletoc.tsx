"use client";

import type { Heading } from "fromsrc";
import { ChevronDownIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function ProgressCircle({ value, className }: { value: number; className?: string }) {
  const size = 16;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, value)) * circumference;

  return (
    <svg
      role="progressbar"
      viewBox={`0 0 ${size} ${size}`}
      className={`size-4 shrink-0 ${className ?? ""}`}
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-current/25" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-300"
      />
    </svg>
  );
}

export function MobileToc({ headings, title }: { headings: Heading[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [activeSet, setActiveSet] = useState<Set<string>>(new Set());
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [thumbStyle, setThumbStyle] = useState({ top: 0, height: 0 });
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const elements = headings
      .map((h) => ({ id: h.id, el: document.getElementById(h.id) }))
      .filter((item): item is { id: string; el: HTMLElement } => Boolean(item.el));

    if (elements.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }
        if (visible.size > 0) {
          setActiveSet(new Set(visible));
          const lastVisible = [...visible].pop();
          const idx = headings.findIndex((h) => h.id === lastVisible);
          if (idx !== -1) setActiveIdx(idx);
        } else {
          let current = elements[0]?.id ?? "";
          let currentIdx = 0;
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].el.getBoundingClientRect().top <= 140) {
              current = elements[i].id;
              currentIdx = i;
            } else {
              break;
            }
          }
          setActiveSet(new Set([current]));
          setActiveIdx(currentIdx);
        }
      },
      { rootMargin: "-64px 0px -40% 0px", threshold: 0 }
    );

    for (const item of elements) observer.observe(item.el);
    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    if (!listRef.current || activeSet.size === 0) return;
    const links = Array.from(listRef.current.querySelectorAll("a[data-active='true']")) as HTMLElement[];
    if (links.length === 0) {
      setThumbStyle({ top: 0, height: 0 });
      return;
    }
    const first = links[0];
    const last = links[links.length - 1];
    setThumbStyle({
      top: first.offsetTop,
      height: last.offsetTop + last.offsetHeight - first.offsetTop,
    });
  }, [activeSet]);

  const measure = useCallback(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  useEffect(() => {
    measure();
  }, [measure, headings]);

  if (headings.length === 0) return null;

  const progress = (activeIdx + 1) / headings.length;
  const activeHeading = headings[activeIdx];
  const showHeading = !open && activeHeading;
  const maxH = Math.min(contentHeight, window.innerHeight * 0.85);

  return (
    <div className="lg:hidden sticky top-16 z-30 font-sans">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center w-full gap-2.5 px-4 py-2.5 text-sm text-muted-foreground backdrop-blur-md transition-colors bg-background/80 border-b ${open ? "border-transparent" : "border-border"}`}
      >
        <ProgressCircle value={progress} className={open ? "text-foreground" : ""} />
        <span className="flex-1 truncate text-left">
          {showHeading ? activeHeading.text : title}
        </span>
        <ChevronDownIcon
          className={`size-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div
        className="absolute left-0 right-0 bg-background/80 backdrop-blur-md overflow-hidden transition-[height,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          height: open ? maxH : 0,
          opacity: open ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="border-b border-border shadow-lg">
          <div className="flex flex-col px-4 pb-4 max-h-[85vh] overflow-y-auto">
            <div ref={listRef} className="relative flex flex-col">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-foreground/10" />
              <div
                className="absolute left-0 w-px bg-foreground transition-all duration-200 ease-out"
                style={{
                  top: thumbStyle.top,
                  height: thumbStyle.height,
                }}
              />
              {headings.map((heading) => {
                const isActive = activeSet.has(heading.id);
                return (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    data-active={isActive}
                    onClick={() => setOpen(false)}
                    className={`relative py-1.5 text-sm transition-colors ${heading.level >= 3 ? "ps-6" : "ps-3"} ${
                      isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {heading.text}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
