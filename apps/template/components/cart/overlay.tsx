"use client";

import { useTranslations } from "next-intl";

import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

import { useCart } from "./context";
import { OverlayContent } from "./overlay-content";

interface CartOverlayProps {
  locale: string;
}

export function CartOverlay({ locale }: CartOverlayProps) {
  const { isOverlayOpen, setOverlayOpen } = useCart();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const t = useTranslations("cart");

  if (isDesktop) {
    return (
      <Sheet open={isOverlayOpen} onOpenChange={setOverlayOpen}>
        <SheetContent side="right" className="w-full max-w-md p-0 gap-0">
          <div className="flex h-16 shrink-0 items-center px-5">
            <SheetTitle className="text-lg font-semibold">{t("shoppingCart")}</SheetTitle>
          </div>
          <SheetDescription className="sr-only">{t("reviewCartDescription")}</SheetDescription>
          <OverlayContent locale={locale} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={isOverlayOpen} onOpenChange={setOverlayOpen}>
      <DrawerContent className="max-h-[85vh]">
        <div className="flex h-16 shrink-0 items-center px-5">
          <DrawerTitle className="text-lg font-semibold">{t("shoppingCart")}</DrawerTitle>
        </div>
        <DrawerDescription className="sr-only">{t("reviewCartDescription")}</DrawerDescription>
        <OverlayContent locale={locale} />
      </DrawerContent>
    </Drawer>
  );
}
