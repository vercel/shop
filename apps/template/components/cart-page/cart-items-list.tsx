"use client";

import { useCartRender } from "@/components/cart/context-sync";
import { OverlayItem } from "@/components/cart/overlay-item";
import type { NamespaceMessages } from "@/lib/i18n";

interface CartItemsListProps {
  labels: NamespaceMessages<"cart">;
  locale: string;
}

export function CartItemsList({ labels, locale }: CartItemsListProps) {
  const cart = useCartRender();
  const lines = cart?.lines ?? [];

  return lines.length === 0 ? (
    <div className="text-center py-10">
      <p className="text-muted-foreground">{labels.empty}</p>
    </div>
  ) : (
    <ul className="space-y-5" aria-label={labels.cartItemsLabel}>
      {lines.map((item) => (
        <OverlayItem key={item.id} item={item} labels={labels} locale={locale} />
      ))}
    </ul>
  );
}
