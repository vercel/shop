"use client";

import { useCartRender } from "./context-sync";
import { ItemRow } from "./item-row";

interface ItemsSectionProps {
  locale: string;
}

export function ItemsSection({ locale }: ItemsSectionProps) {
  const cart = useCartRender();
  const lines = cart?.lines ?? [];

  return (
    <div className="space-y-4">
      {lines.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No items in your cart</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lines.map((item) => (
            <ItemRow key={item.id} item={item} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
