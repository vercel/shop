"use client";

import { useCart } from "@shopify/hydrogen/react";
import { XIcon } from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

import { useCartDrawer } from "./context";
import { OverlayContent } from "./overlay-content";

function CartCountBadge() {
  const count = useCart((state) => state.data.totalQuantity);
  if (count === 0) return null;
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
      {count}
    </span>
  );
}

interface CartOverlayProps {
  description: string;
  title: string;
}

export function CartOverlay({ description, title }: CartOverlayProps) {
  const { isOverlayOpen, setOverlayOpen } = useCartDrawer();

  return (
    <Sheet open={isOverlayOpen} onOpenChange={setOverlayOpen}>
      <SheetContent closeButton={false} overlay={false} side="right" className="gap-0 p-0">
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-2.5">
          <div className="flex items-center gap-1.5">
            <SheetTitle className="font-normal text-xl leading-4">{title}</SheetTitle>
            <CartCountBadge />
          </div>
          <SheetClose
            aria-label="Close cart"
            className="flex cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon className="size-5" />
          </SheetClose>
        </div>
        <SheetDescription className="sr-only">{description}</SheetDescription>
        <OverlayContent />
      </SheetContent>
    </Sheet>
  );
}
