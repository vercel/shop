import type { Cart } from "@/lib/types";

export function cartDiscountAmount(cart: Cart): number {
  // Hydrogen's cart query omits discountAllocations, so this is 0 under the Hydrogen stack.
  return (cart.discountAllocations ?? []).reduce(
    (sum, a) => sum + parseFloat(a.discountedAmount.amount),
    0,
  );
}
