"use client";

import { useCartRender } from "@/components/cart/context-sync";

export function Header({ title }: { title: string }) {
  const cart = useCartRender();
  const count = cart?.totalQuantity ?? 0;

  return (
    <div className="flex items-center gap-2.5">
      <h1 className="text-3xl sm:text-4xl md:text-5xl">{title}</h1>
      {count > 0 && (
        <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-sm text-background">
          {count}
        </span>
      )}
    </div>
  );
}
