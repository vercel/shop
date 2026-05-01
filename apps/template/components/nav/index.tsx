import Link from "next/link";
import { Suspense } from "react";

import { isAuthEnabled } from "@/lib/auth";
import { navItems, siteConfig } from "@/lib/config";

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
            regardless of the left/right group widths. */}
        <Link
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center"
          href="/"
        >
          <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tighter text-link leading-none">
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
