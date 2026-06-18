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
      <div className="mx-auto grid h-16 grid-cols-[1fr_auto_1fr] items-center px-5 lg:px-10">
        <div className="flex items-center gap-2.5 md:gap-5">
          <MobileMenu items={items} />
          <QuickLinks items={items} />
        </div>

        <Link className="flex items-center gap-2 justify-self-center" href="/">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
            <polygon points="12,3 21,18.6 3,18.6" />
          </svg>
          <span className="text-xl font-semibold leading-4 tracking-tight">{siteConfig.name}</span>
        </Link>

        <div className="flex items-center gap-5 justify-self-end">
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
