import Link from "next/link";
import { Suspense } from "react";

import { isAuthEnabled } from "@/lib/auth";
import { type Locale } from "@/lib/i18n";
import { tNamespace } from "@/lib/i18n/server";

import { NavAccount, NavAccountFallback } from "./account";
import { CartIcon, CartIconFallback } from "./cart";
import { defaultNavItems } from "./menu-data";
import { MobileMenu } from "./mobile-menu";
import { QuickLinks } from "./quick-links";
import { SearchModal } from "./search-modal";

export async function Nav({ locale }: { locale: Locale }) {
  const items = defaultNavItems;
  const navLabels = await tNamespace("nav");

  return (
    <nav
      className="sticky top-0 z-30 w-full bg-background pt-[env(safe-area-inset-top,0px)] transition-shadow duration-250"
      id="nav-outer"
    >
      <div className="mx-auto flex h-16 items-center gap-2.5 md:gap-5 px-5 lg:px-10">
        <MobileMenu
          items={items}
          menuLabel={navLabels.menu}
          showAllTemplate={navLabels.showAllCategory}
        />

        <Link className="flex items-center shrink-0" href="/">
          <span className="text-xl font-semibold leading-4 tracking-tight">Vercel Shop</span>
        </Link>

        <QuickLinks items={items} />

        <div className="flex items-center gap-5 ml-auto">
          <SearchModal labels={navLabels} locale={locale} />
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
