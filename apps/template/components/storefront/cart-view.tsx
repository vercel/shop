import { CartContextSync } from "@/components/cart/context-sync";
import type { Locale } from "@/lib/i18n";
import type { Cart } from "@/lib/types";

import { StorefrontCanvas } from "./canvas";

interface CartViewProps {
  cart: Cart | null;
  locale: Locale;
}

export function CartView({ cart, locale }: CartViewProps) {
  return (
    <CartContextSync cart={cart}>
      <StorefrontCanvas
        route="cart"
        data-line-count={cart?.lines.length ?? 0}
        data-locale={locale}
        data-total-quantity={cart?.totalQuantity ?? 0}
      />
    </CartContextSync>
  );
}

export function CartViewFallback({ locale }: { locale: Locale }) {
  return <StorefrontCanvas route="cart" data-locale={locale} data-loading />;
}
