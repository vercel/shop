import { tNamespace } from "@/lib/i18n/server";

import { CartOverlay } from "./overlay";

export async function CartOverlayWithAddress({ locale }: { locale: string }) {
  const labels = await tNamespace("cart");
  return <CartOverlay labels={labels} locale={locale} />;
}
