import Link from "next/link";
import { Suspense } from "react";

import { CartIcon, CartIconFallback } from "./cart";
import { Megamenu } from "./megamenu";
import { QuickLinks } from "./quick-links";

export function Nav({ locale }: { locale: string }) {
  return (
    <nav
      className="sticky top-0 z-30 w-full bg-white pt-[env(safe-area-inset-top,0px)] transition-shadow duration-250"
      id="nav-outer"
    >
      <div className="mx-auto flex h-16 items-center gap-6 px-4 lg:px-8">
        <Link className="flex items-center gap-2 shrink-0" href="/">
          <svg viewBox="0 0 76 65" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
          </svg>
          <span className="text-zinc-300 text-base leading-4" aria-hidden="true">
            /
          </span>
          <span className="text-xl font-semibold leading-4 tracking-tight">Shop</span>
        </Link>

        <Suspense fallback={null}>
          <Megamenu locale={locale} />
        </Suspense>

        <Suspense fallback={null}>
          <QuickLinks locale={locale} />
        </Suspense>

        <div className="flex items-center gap-4 ml-auto">
          <Suspense fallback={<CartIconFallback />}>
            <CartIcon />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
