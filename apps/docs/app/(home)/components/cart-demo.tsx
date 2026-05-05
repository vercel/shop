"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconCart } from "@/components/assets/icons/icon-cart";

type Phase =
  | "idle"
  | "cursor-enter"
  | "cursor-on-button"
  | "press"
  | "updated"
  | "hold";

interface Product {
  name: string;
  price: string;
  image: string;
  imageDark: string;
}

const products: Product[] = [
  {
    name: "Running",
    price: "$95",
    image: "/sneakers/sneaker-1.png",
    imageDark: "/sneakers/sneaker-1-dark.png",
  },
  {
    name: "Sport",
    price: "$88",
    image: "/sneakers/sneaker-4.png",
    imageDark: "/sneakers/sneaker-4-dark.png",
  },
  {
    name: "Classic",
    price: "$62",
    image: "/sneakers/sneaker-2.png",
    imageDark: "/sneakers/sneaker-2-dark.png",
  },
];

const CursorIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z" />
  </svg>
);

export const CartDemo = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const ref = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const runAnimation = useCallback(() => {
    setPhase("cursor-enter");

    timeoutRef.current = setTimeout(() => {
      setPhase("cursor-on-button");

      timeoutRef.current = setTimeout(() => {
        setPhase("press");

        timeoutRef.current = setTimeout(() => {
          setPhase("updated");

          timeoutRef.current = setTimeout(() => {
            setPhase("hold");
            timeoutRef.current = setTimeout(() => {
              setPhase("idle");
              timeoutRef.current = setTimeout(() => {
                runAnimation();
              }, 1500);
            }, 2500);
          }, 100);
        }, 200);
      }, 400);
    }, 650);
  }, []);

  useEffect(() => {
    if (hasStarted.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          observer.disconnect();
          setTimeout(() => runAnimation(), 800);
        }
      },
      { threshold: 0.5 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [runAnimation]);

  useEffect(() => clearTimeouts, [clearTimeouts]);

  const isUpdated = phase === "updated" || phase === "hold";
  const showCursor =
    phase === "cursor-enter" ||
    phase === "cursor-on-button" ||
    phase === "press";
  const isPressing = phase === "press";

  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-alpha-400 bg-background-100"
      ref={ref}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-alpha-400 px-5 py-3.5">
        <span className="text-xs font-medium text-gray-700">Shop</span>
        <div className="relative">
          <IconCart className="text-foreground" size={16} />
          {isUpdated && (
            <span className="absolute -right-2 -top-2 flex size-3.5 items-center justify-center rounded-full bg-red-800 text-[9px] font-medium text-white animate-[scale-in_0.15s_ease-out]">
              1
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col bg-background-200 xl:flex-row">
        {/* Products */}
        <div className="relative flex flex-col gap-1 border-b border-gray-alpha-400 p-5 xl:flex-[2] xl:border-b-0 xl:border-r">
          <span className="mb-2 text-xs font-medium text-gray-700">
            Products
          </span>
          {products.map((product, i) => {
            const isFirst = i === 0;
            const isLast = i === products.length - 1;
            return (
              <div
                className={`relative flex items-center gap-4 rounded px-2 ${
                  isFirst
                    ? "border border-gray-alpha-400 bg-background-100"
                    : ""
                } ${!isFirst && !isLast ? "border-b border-gray-200" : ""}`}
                key={product.name}
              >
                <div className="relative size-14 shrink-0">
                  <Image
                    alt={product.name}
                    className="object-contain dark:hidden"
                    fill
                    sizes="56px"
                    src={product.image}
                  />
                  <Image
                    alt={product.name}
                    className="hidden object-contain dark:block"
                    fill
                    sizes="56px"
                    src={product.imageDark}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-xs text-foreground">
                    {product.name}
                  </span>
                  <span className="text-xs text-gray-600">{product.price}</span>
                </div>
                <button
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-transform bg-background-200 text-gray-800 border border-gray-alpha-400 ${isFirst && isPressing ? "scale-95" : "scale-100"}`}
                  disabled={phase !== "idle"}
                  onClick={() => {
                    if (isFirst && phase === "idle") runAnimation();
                  }}
                  type="button"
                >
                  <IconCart size={12} />
                  Add
                </button>
                {isLast && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background-200 to-transparent"
                  />
                )}
              </div>
            );
          })}

          {/* Animated cursor */}
          {showCursor && (
            <div
              className="pointer-events-none absolute z-10 transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] drop-shadow-md"
              style={{
                top: phase === "cursor-enter" ? "85%" : "70px",
                right: phase === "cursor-enter" ? "5%" : "32px",
              }}
            >
              <CursorIcon
                className={`size-6 text-foreground transition-transform duration-100 ${
                  isPressing ? "scale-75" : "scale-100"
                }`}
              />
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="flex w-full flex-col p-5 xl:w-[34%]">
          <span className="mb-4 text-xs font-medium text-gray-700">Cart</span>
          {isUpdated ? (
            <div className="flex flex-col gap-4 animate-[fade-in_0.15s_ease]">
              <div className="flex items-center gap-3">
                <div className="relative flex size-12 shrink-0 items-center justify-center rounded border border-gray-alpha-400 bg-background-100">
                  <Image
                    alt="Running"
                    className="object-contain p-1 dark:hidden"
                    fill
                    sizes="48px"
                    src="/sneakers/sneaker-1.png"
                  />
                  <Image
                    alt="Running"
                    className="hidden object-contain p-1 dark:block"
                    fill
                    sizes="48px"
                    src="/sneakers/sneaker-1-dark.png"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground">Running</span>
                    <span className="text-xs text-gray-700">$95</span>
                  </div>
                  <span className="text-[9px] text-gray-600">Shoe</span>
                </div>
              </div>
              <div className="border-t border-gray-alpha-400" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">$95.00</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <span className="text-xs text-gray-500">Empty</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
