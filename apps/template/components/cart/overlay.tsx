"use client";

import { useTranslations } from "next-intl";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
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
        <SheetContent side="right" className="w-full max-w-md p-0">
          <SheetTitle className="sr-only">{t("shoppingCart")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("reviewCartDescription")}
          </SheetDescription>
          <OverlayContent locale={locale} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={isOverlayOpen} onOpenChange={setOverlayOpen}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerTitle className="sr-only">{t("shoppingCart")}</DrawerTitle>
        <DrawerDescription className="sr-only">
          {t("reviewCartDescription")}
        </DrawerDescription>
        <OverlayContent locale={locale} />
      </DrawerContent>
    </Drawer>
  );
}
