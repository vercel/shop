import { UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { isAuthConfigured } from "@/lib/auth/auth";
import { NavAccount } from "./account";
import { CartIcon, CartIconFallback } from "./cart";
import { MobileMenu } from "./mobile-menu";
import { QuickLinks } from "./quick-links";
import { SearchModal } from "./search-modal";

export async function Nav({ locale }: { locale: string }) {
  return (
    <nav
      className="sticky top-0 z-30 w-full bg-background pt-[env(safe-area-inset-top,0px)] transition-shadow duration-250"
      id="nav-outer"
    >
      <div className="mx-auto flex h-16 items-center gap-2.5 md:gap-5 px-5 lg:px-10">
        <MobileMenu />

        <Link className="flex items-center shrink-0" href="/">
          <span className="text-xl font-semibold leading-4 tracking-tight">Vercel Shop</span>
        </Link>

        <QuickLinks />

        <div className="flex items-center gap-5 ml-auto">
          <SearchModal />
          {/* {isAuthConfigured && (
            <div className="size-5 bg-[red]" />
          )} */}
          <Suspense fallback={<CartIconFallback />}>
            <CartIcon />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
