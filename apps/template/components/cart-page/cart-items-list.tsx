"use client";

import { useCartRender } from "@/components/cart/context-sync";
import { OverlayItem } from "@/components/cart/overlay-item";

interface CartItemsListProps {
  emptyLabel: string;
  itemsLabel: string;
  locale: string;
}

export function CartItemsList({ emptyLabel, itemsLabel, locale }: CartItemsListProps) {
  const cart = useCartRender();
  const lines = cart?.lines ?? [];

  return lines.length === 0 ? (
    <div className="text-center py-10">
      <p className="text-muted-foreground">{emptyLabel}</p>
    </div>
  ) : (
    <ul className="space-y-5" aria-label={itemsLabel}>
      {lines.map((item) => (
        <OverlayItem key={item.id} item={item} locale={locale} />
      ))}
    </ul>
  );
}
