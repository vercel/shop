"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserChrome } from "@/components/storefront-hero/browser-chrome";

const CURL_COMMAND =
  'curl -H "Accept: text/markdown" https://vercel.shop/en-US/products/classic-tee';

const MARKDOWN_RESPONSE = `# Classic Tee

**$29.00** ~~$35.00~~  · In Stock

A premium cotton t-shirt with a relaxed fit.

## Variants

| Color | Size | Available |
|-------|------|-----------|
| Black | S    | ✓         |
| Black | M    | ✓         |
| Black | L    | ✓         |
| White | S    | ✓         |
| White | M    | ✗         |

## Specs

- **Material:** 100% organic cotton
- **Weight:** 180gsm
- **Origin:** Portugal`;

export const ContentNegotiationDemo = () => {
  const [phase, setPhase] = useState<
    "idle" | "typing" | "loading" | "response"
  >("idle");
  const [charIndex, setCharIndex] = useState(0);
  const [responseLines, setResponseLines] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const lines = MARKDOWN_RESPONSE.split("\n");

  useEffect(() => {
    if (hasStarted.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          observer.disconnect();
          setTimeout(() => setPhase("typing"), 500);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== "typing") return;
    if (charIndex >= CURL_COMMAND.length) {
      setTimeout(() => setPhase("loading"), 400);
      return;
    }
    const timeout = setTimeout(
      () => setCharIndex((i) => i + 1),
      20 + Math.random() * 30,
    );
    return () => clearTimeout(timeout);
  }, [phase, charIndex]);

  useEffect(() => {
    if (phase !== "loading") return;
    const t = setTimeout(() => setPhase("response"), 800);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "response") return;
    if (responseLines >= lines.length) return;
    const t = setTimeout(
      () => setResponseLines((n) => n + 1),
      30 + Math.random() * 20,
    );
    return () => clearTimeout(t);
  }, [phase, responseLines, lines.length]);

  return (
    <BrowserChrome showLockIcon={false} url="Terminal">
      <div
        ref={ref}
        className="flex h-64 flex-col gap-1 overflow-hidden sm:h-80"
      >
        {phase !== "idle" && (
          <div className="flex items-start gap-2 animate-[fade-in_0.15s_ease]">
            <span className="font-mono text-xs leading-5 text-gray-1000">$</span>
            <span className="font-mono text-xs leading-5 text-gray-1000 break-all">
              {phase === "typing"
                ? CURL_COMMAND.slice(0, charIndex)
                : CURL_COMMAND}
              <span
                aria-hidden
                className={`ml-0.5 inline-block h-3.5 w-[5px] align-middle bg-black/70 dark:bg-white/70 ${
                  phase === "typing"
                    ? "animate-[pulse_0.6s_ease-in-out_infinite]"
                    : "invisible"
                }`}
              />
            </span>
          </div>
        )}

        {phase === "loading" && (
          <div className="mt-1 animate-[fade-in_0.2s_ease]">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-1000">
              <svg
                className="size-3 animate-spin"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M12 2v4m0 12v4m-7.07-3.93 2.83-2.83m8.48-8.48 2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83" />
              </svg>
              Fetching…
            </span>
          </div>
        )}

        {phase === "response" && (
          <div className="mt-2 flex flex-col gap-0 overflow-y-auto animate-[fade-in_0.2s_ease]">
            {lines.slice(0, responseLines).map((line, i) => (
              <span
                key={i}
                className={`font-mono text-xs leading-relaxed text-gray-700 ${
                  line.startsWith("# ")
                    ? "font-bold text-sm"
                    : line.startsWith("## ")
                      ? "font-semibold mt-1"
                      : ""
                }`}
              >
                {line || "\u00A0"}
              </span>
            ))}
          </div>
        )}
      </div>
    </BrowserChrome>
  );
};
