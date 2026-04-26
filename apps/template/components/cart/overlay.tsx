"use client";

import { useTranslations } from "next-intl";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

import { useCart } from "./context";
import { OverlayContent } from "./overlay-content";

function CartCountBadge() {
  const { cartWithPending } = useCart();
  const count = cartWithPending?.totalQuantity ?? 0;
  if (count === 0) return null;
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
      {count}
    </span>
  );
}

interface CartOverlayProps {
  locale: string;
}

export function CartOverlay({ locale }: CartOverlayProps) {
  const { isOverlayOpen, setOverlayOpen } = useCart();
  const t = useTranslations("cart");

  return (
    <Sheet open={isOverlayOpen} onOpenChange={setOverlayOpen}>
      <SheetContent side="right" className="w-full max-w-md p-0 gap-0">
        <div className="flex h-16 shrink-0 items-center gap-2 px-5">
          <SheetTitle className="text-lg font-semibold">{t("shoppingCart")}</SheetTitle>
          <CartCountBadge />
        </div>
        <SheetDescription className="sr-only">{t("reviewCartDescription")}</SheetDescription>
        <OverlayContent locale={locale} />
      </SheetContent>
    </Sheet>
  );
}
