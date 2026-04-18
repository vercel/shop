import Link from "next/link";
import { Suspense } from "react";

import { CartIcon, CartIconFallback } from "./cart";
import { MobileMenu } from "./mobile-menu";
import { QuickLinks } from "./quick-links";

export function Nav({ locale }: { locale: string }) {
  return (
    <nav
      className="sticky top-0 z-30 w-full bg-background pt-[env(safe-area-inset-top,0px)] transition-shadow duration-250"
      id="nav-outer"
    >
      <div className="mx-auto flex h-16 items-center gap-4 px-4 lg:px-8">
        <MobileMenu />

        <Link className="flex items-center shrink-0" href="/">
          <span className="text-xl font-semibold leading-4 tracking-tight">Vercel Shop</span>
        </Link>

        <QuickLinks />

        <div className="flex items-center gap-4 ml-auto">
          <Suspense fallback={<CartIconFallback />}>
            <CartIcon />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
