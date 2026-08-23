import { PredictiveSearchProvider } from "@shopify/hydrogen/react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { Container } from "@/components/ui/container";
import { shopConfig } from "@/lib/config";

import { NavAccount, NavAccountFallback } from "./account";
import { CartIcon, CartIconFallback } from "./cart";
import { MobileMenu } from "./mobile-menu";
import { QuickLinks } from "./quick-links";
import { SearchModal } from "./search-modal";

export async function Nav({ locale }: { locale: string }) {
  const messages = await getMessages();
  const items = shopConfig.navigation.nav;

  return (
    <nav
      className="sticky top-0 z-30 w-full bg-background pt-[env(safe-area-inset-top,0px)] transition-shadow duration-250"
      id="nav-outer"
    >
      <NextIntlClientProvider messages={{ nav: messages.nav }}>
        <Container className="flex h-16 items-center gap-2.5 md:gap-5">
          <div className="flex flex-1 min-w-0 items-center gap-5">
            <MobileMenu items={items} />
            <QuickLinks items={items} />
          </div>

          <Link className="flex items-center shrink-0" href="/" prefetch={true}>
            <span className="text-xl leading-4">{shopConfig.site.name}</span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-5">
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
      </NextIntlClientProvider>
    </nav>
  );
}
