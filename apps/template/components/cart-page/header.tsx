"use client";

import { useCartRender } from "@/components/cart/context-sync";

interface HeaderProps {
  shoppingCartLabel: string;
}

export function Header({ shoppingCartLabel }: HeaderProps) {
  const cart = useCartRender();
  const count = cart?.totalQuantity ?? 0;

  return (
    <div className="flex items-center gap-2.5">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
        {shoppingCartLabel}
      </h1>
      {count > 0 && (
        <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-sm text-background">
          {count}
        </span>
      )}
    </div>
  );
}
