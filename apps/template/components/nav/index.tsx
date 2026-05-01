import Link from "next/link";
import type * as React from "react";
import { Suspense } from "react";

import { isAuthEnabled } from "@/lib/auth";
import { navItems, siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

import { NavAccount, NavAccountFallback } from "./account";
import { CartIcon, CartIconFallback } from "./cart";
import { MobileMenu } from "./mobile-menu";
import { QuickLinks } from "./quick-links";
import { SearchModal } from "./search-modal";

export async function Nav({ locale }: { locale: string }) {
  const items = navItems;

  return (
    <nav
      className="sticky top-0 z-30 w-full bg-background pt-[env(safe-area-inset-top,0px)] transition-shadow duration-250"
      id="nav-outer"
    >
      <div className="relative mx-auto flex h-16 items-center px-5 lg:px-10">
        <div className="flex items-center gap-2.5 md:gap-5">
          <MobileMenu items={items} />
          <QuickLinks items={items} />
        </div>

        {/* Absolutely positioned so the logomark sits at viewport center
            regardless of the left/right group widths. items-baseline so
            the svg's box bottom aligns with the wordmark's text baseline. */}
        <Link
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-baseline gap-1.5 text-link"
          href="/"
        >
          <Logomark />
          <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tighter leading-none">
            {siteConfig.name}
          </span>
        </Link>

        <div className="flex items-center gap-5 ml-auto">
          <SearchModal />
          {isAuthEnabled && (
            <Suspense fallback={<NavAccountFallback />}>
              <NavAccount />
            </Suspense>
          )}
          <Suspense fallback={<CartIconFallback />}>
            <CartIcon />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}

// Modernist sans-serif katakana ハ as the roof, three sides of a square as the
// house body slightly offset right of the roof's centerline. Sized in em so it
// scales with the wordmark next to it; currentColor so it inherits the link
// color. Drawn to fill the viewBox bottom-flush so flex items-baseline puts
// the visual bottom on the text baseline.
function Logomark({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={cn("size-[1em] shrink-0", className)}
      {...props}
    >
      <path d="M10 3 4 12" />
      <path d="M14 3 20 12" />
      <path d="M10 14v9h8v-9" />
    </svg>
  );
}
