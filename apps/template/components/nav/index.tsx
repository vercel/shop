import Link from "next/link";
import { Suspense } from "react";

import { Container } from "@/components/ui/container";
import { shopConfig } from "@/shop.config";

import { CartIcon, CartIconFallback } from "./cart";
import { MobileMenu } from "./mobile-menu";
import { QuickLinks } from "./quick-links";

export async function Nav({ locale }: { locale: string }) {
  const items = shopConfig.navigation.nav;

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
          <Suspense fallback={<CartIconFallback />}>
            <CartIcon />
          </Suspense>
        </div>
      </Container>
    </nav>
  );
}
