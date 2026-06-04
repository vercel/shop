import type { Cart } from "@/lib/types";

export function cartDiscountAmount(cart: Cart): number {
  return cart.discountAllocations.reduce(
    (sum, a) => sum + parseFloat(a.discountedAmount.amount),
    0,
  );
}
