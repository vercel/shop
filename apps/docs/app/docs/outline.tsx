"use client";

import type { Heading } from "fromsrc";
import { TextIcon } from "lucide-react";
import { PageActions } from "./actions";
import { useCallback, useEffect, useRef, useState } from "react";

interface ZigzagPath {
  path: string;
  width: number;
  height: number;
}

function xOffset(level: number): number {
  return level >= 3 ? 10.5 : 0.5;
}

function padLeft(level: number): number {
  return level >= 3 ? 26 : 14;
}

function buildPath(headings: Heading[], container: HTMLElement): ZigzagPath | null {
  if (container.clientHeight === 0) return null;

  let w = 0;
  let h = 0;
  const d: string[] = [];

  for (let i = 0; i < headings.length; i++) {
    const item = headings[i];
    if (!item) continue;

    const element = container.querySelector(`a[href="#${item.id}"]`) as HTMLElement | null;
    if (!element) continue;

    const styles = getComputedStyle(element);
    const x = xOffset(item.level);
    const top = element.offsetTop + Number.parseFloat(styles.paddingTop);
    const bottom = element.offsetTop + element.clientHeight - Number.parseFloat(styles.paddingBottom);

    w = Math.max(x, w);
    h = Math.max(h, bottom + 4);

    d.push(`${d.length === 0 ? "M" : "L"}${x} ${top}`);
    d.push(`L${x} ${bottom + 4}`);
  }

  if (d.length === 0) return null;
  return { height: Math.max(h, container.clientHeight), path: d.join(" "), width: w + 1 };
}

export function Outline({ headings, slug }: { headings: Heading[]; slug: string }) {
  const [activeSet, setActiveSet] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<ZigzagPath | null>(null);

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
        } else {
          let current = elements[0]?.id ?? "";
          for (const item of elements) {
            if (item.el.getBoundingClientRect().top <= 140) current = item.id;
            else break;
          }
          setActiveSet(new Set([current]));
        }
      },
      { rootMargin: "-64px 0px -40% 0px", threshold: 0 }
    );

    for (const item of elements) observer.observe(item.el);
    return () => observer.disconnect();
  }, [headings]);

  const measure = useCallback(() => {
    if (!containerRef.current || headings.length === 0) return;
    setSvg(buildPath(headings, containerRef.current));
  }, [headings]);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    const progress = progressRef.current;
    const container = containerRef.current;
    if (!progress || !container || !svg) return;

    const activeLinks = Array.from(container.querySelectorAll("a[data-active='true']")) as HTMLElement[];
    if (activeLinks.length === 0) {
      progress.style.height = "0px";
      progress.style.top = "0px";
      return;
    }

    const first = activeLinks[0];
    const last = activeLinks[activeLinks.length - 1];
    const firstStyles = getComputedStyle(first);
    const lastStyles = getComputedStyle(last);
    const top = first.offsetTop + Number.parseFloat(firstStyles.paddingTop);
    const bottom = last.offsetTop + last.clientHeight - Number.parseFloat(lastStyles.paddingBottom) + 4;

    progress.style.top = `${top}px`;
    progress.style.height = `${bottom - top}px`;
  }, [svg, activeSet]);

  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="fixed top-[4rem] w-56 h-[calc(100dvh-4rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-12 pl-8 pe-4 pb-6">
        {headings.length > 0 && (
          <>
            <p className="flex items-center gap-2 mb-4 text-sm text-muted-foreground font-medium">
              <TextIcon className="size-4" aria-hidden="true" />
              On this page
            </p>
            <nav aria-label="table of contents" className="relative">
          {svg && (
            <>
              <svg
                className="absolute left-0 top-0 pointer-events-none"
                width={svg.width}
                height={svg.height}
                aria-hidden="true"
              >
                <path d={svg.path} fill="none" className="stroke-foreground/10" strokeWidth="1" />
              </svg>
              <div
                className="absolute left-0 pointer-events-none z-10"
                style={{
                  height: svg.height,
                  width: svg.width,
                  maskImage: `url("data:image/svg+xml,${encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svg.width} ${svg.height}"><path d="${svg.path}" stroke="black" stroke-width="1" fill="none" /></svg>`
                  )}")`,
                  maskSize: "100% 100%",
                }}
              >
                <div
                  ref={progressRef}
                  className="absolute w-full bg-foreground transition-all duration-150 ease-out"
                />
              </div>
            </>
          )}

          <div ref={containerRef} className="flex flex-col">
            {headings.map((heading) => {
              const isactive = activeSet.has(heading.id);
              return (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  data-active={isactive}
                  className={`relative py-1.5 text-sm transition-colors ${
                    isactive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={{ paddingLeft: padLeft(heading.level) }}
                >
                  {heading.text}
                </a>
              );
            })}
          </div>
        </nav>
          </>
        )}
        <PageActions slug={slug} />
      </div>
    </aside>
  );
}
