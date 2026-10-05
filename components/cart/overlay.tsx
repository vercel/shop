"use client";

import { Loader2, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart/client";

import { useCartDrawer } from "./context";
import { CartLineItem } from "./line-item";
import { CartSummary } from "./summary";
import { CartWarnings } from "./warnings";

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

function OverlayContent() {
  const router = useRouter();
  const cart = useCart((state) => state.data);
  const isLoading = useCart((state) => state.loading);
  const { setOverlayOpen } = useCartDrawer();
  if (isLoading && cart.lines.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center gap-2.5" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading cart…
      </div>
    );
  }
  if (cart.lines.nodes.length === 0) {
    return (
      <div className="flex h-full flex-col gap-5 px-2.5">
        <CartWarnings />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h3 className="mb-6 text-2xl">Your cart is empty</h3>
          <Button
            onClick={() => {
              setOverlayOpen(false);
              router.push("/");
            }}
            className="h-12 px-8"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col">
      <div className="grid flex-1 content-start gap-5 overflow-y-auto px-2.5 py-5">
        <CartWarnings />
        <ul className="grid gap-5" aria-label="Cart items">
          {cart.lines.nodes.map((item) => (
            <CartLineItem key={item.id} item={item} />
          ))}
        </ul>
      </div>
      <footer className="px-2.5 pt-5 pb-2.5">
        <CartSummary cart={cart} />
      </footer>
    </div>
  );
}
