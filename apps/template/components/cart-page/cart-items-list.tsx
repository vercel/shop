"use client";

import { useCart } from "@shopify/hydrogen/react";

import { OverlayItem } from "@/components/cart/overlay-item";
import type { Cart, CartLine } from "@/lib/cart";

interface CartItemsListProps {
  emptyLabel: string;
  itemsLabel: string;
}

export function CartItemsList({ emptyLabel, itemsLabel }: CartItemsListProps) {
  const lines = useCart<Cart, CartLine[]>((state) => state.data.lines.nodes);
  return lines.length === 0 ? (
    <div className="text-center py-10">
      <p className="text-muted-foreground">{emptyLabel}</p>
    </div>
  ) : (
    <ul className="space-y-5" aria-label={itemsLabel}>
      {lines.map((item) => (
        <OverlayItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
