"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const seen = new Set<string>();

function prefetchImage(src: string, sizes: string) {
  if (seen.has(src)) {
    return;
  }
  const img = new Image();
  img.decoding = "async";
  img.fetchPriority = "low";
  img.sizes = sizes;
  seen.add(src);
  img.src = src;
}

export const PrefetchLink: typeof Link = (({ children, ...props }) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (props.prefetch === false) return;

    const linkElement = linkRef.current;
    if (!linkElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          prefetchTimeoutRef.current = setTimeout(() => {
            // Prefetch the route
            router.prefetch(String(props.href));

            // Find the product image in this link and prefetch it at PDP size
            const img = linkElement.querySelector("img");
            if (img?.src) {
              // PDP uses: (max-width: 1024px) 100vw, 50vw
              prefetchImage(img.src, "(max-width: 1024px) 100vw, 50vw");
            }

            observer.unobserve(entry.target);
          }, 300);
        } else if (prefetchTimeoutRef.current) {
          clearTimeout(prefetchTimeoutRef.current);
          prefetchTimeoutRef.current = null;
        }
      },
      { rootMargin: "0px", threshold: 0.1 },
    );

    observer.observe(linkElement);

    return () => {
      observer.disconnect();
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, [props.href, props.prefetch, router]);

  return (
    <Link
      ref={linkRef}
      prefetch={false}
      onMouseEnter={() => {
        if (props.prefetch === false) return;

        router.prefetch(String(props.href));

        // Prefetch image on hover too
        const img = linkRef.current?.querySelector("img");
        if (img?.src) {
          prefetchImage(img.src, "(max-width: 1024px) 100vw, 50vw");
        }
      }}
      {...props}
    >
      {children}
    </Link>
  );
}) as typeof Link;
