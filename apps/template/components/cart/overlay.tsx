"use client";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { NamespaceMessages } from "@/lib/i18n";

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
  labels: NamespaceMessages<"cart">;
  locale: string;
}

export function CartOverlay({ labels, locale }: CartOverlayProps) {
  const { isOverlayOpen, setOverlayOpen } = useCart();

  return (
    <Sheet open={isOverlayOpen} onOpenChange={setOverlayOpen}>
      <SheetContent side="right" className="p-0 gap-0">
        <div className="flex h-16 shrink-0 items-center gap-2 px-5">
          <SheetTitle className="text-lg font-semibold">{labels.shoppingCart}</SheetTitle>
          <CartCountBadge />
        </div>
        <SheetDescription className="sr-only">{labels.reviewCartDescription}</SheetDescription>
        <OverlayContent labels={labels} locale={locale} />
      </SheetContent>
    </Sheet>
  );
}
