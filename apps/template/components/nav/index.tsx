import { PredictiveSearchProvider } from "@shopify/hydrogen/react";
import Link from "next/link";
import { Suspense } from "react";

import { Container } from "@/components/ui/container";
import { shopConfig } from "@/lib/config";
import type { MenuItem } from "@/lib/shopify/types/menu";

import { NavAccount, NavAccountFallback } from "./account";
import { CartIcon, CartIconFallback } from "./cart";
import { MobileMenu } from "./mobile-menu";
import { QuickLinks } from "./quick-links";
import { SearchModal } from "./search-modal";

export function Nav() {
  const items: MenuItem[] = [
    { id: "default-nav-shop", title: "Shop", url: "/collections/all", type: "HTTP", items: [] },
  ];
  return (
    <nav
      className="sticky top-0 z-30 w-full bg-background pt-[env(safe-area-inset-top,0px)] transition-shadow duration-250"
      id="nav-outer"
    >
      <Container className="flex h-16 items-center gap-2.5 md:gap-5">
        <MobileMenu items={items} />

        <Link className="flex items-center shrink-0" href="/">
          <span className="text-xl leading-4">{shopConfig.site.name}</span>
        </Link>

        <QuickLinks items={items} />

        <div className="flex items-center gap-5 ml-auto">
          <PredictiveSearchProvider
            debounceInMs={300}
            limit={3}
            types={["PRODUCT", "COLLECTION", "QUERY"]}
          >
            <SearchModal />
          </PredictiveSearchProvider>
          {shopConfig.auth.isEnabled && (
            <Suspense fallback={<NavAccountFallback />}>
              <NavAccount />
            </Suspense>
          )}
          <Suspense fallback={<CartIconFallback />}>
            <CartIcon />
          </Suspense>
        </div>
      </Container>
    </nav>
  );
}
