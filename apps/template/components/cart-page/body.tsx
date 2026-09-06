"use client";

import { useLocale, useTranslations } from "next-intl";

import { OverlayItem } from "@/components/cart/overlay-item";
import { CartWarnings } from "@/components/cart/warnings";
import { Container } from "@/components/ui/container";
import Link from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { useSuspenseCart } from "@/lib/cart/client";

import { Summary } from "./summary";

export function CartPageBody() {
  const locale = useLocale();
  const t = useTranslations("cart");
  const cart = useSuspenseCart((state) => state.data);

  if (cart.totalQuantity === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-10 px-5">
        <h2 className="text-2xl sm:text-3xl">{t("empty")}</h2>
        <Link
          href="/"
          prefetch={true}
          className="inline-flex cursor-pointer items-center justify-center h-12 px-8 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <Page>
      <Container>
        <Sections>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl md:text-5xl">{t("title")}</h1>
            <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-sm text-background">
              {cart.totalQuantity}
            </span>
          </div>
          <CartWarnings />
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8 xl:col-span-9">
              <ul className="grid gap-5" aria-label={t("cartItemsLabel")}>
                {cart.lines.nodes.map((item) => (
                  <OverlayItem key={item.id} item={item} locale={locale} />
                ))}
              </ul>
            </div>
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="lg:sticky lg:top-20">
                <Summary
                  locale={locale}
                  completeCheckoutLabel={t("completeCheckout")}
                  estimatedTotalLabel={t("estimatedTotal")}
                  taxesAndShippingNote={t("taxesAndShippingNote")}
                  updatingCartLabel={t("updatingCart")}
                />
              </div>
            </aside>
          </div>
        </Sections>
      </Container>
    </Page>
  );
}
