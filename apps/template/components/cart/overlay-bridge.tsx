import { getTranslations } from "next-intl/server";

import { CartOverlay } from "./overlay";

export async function CartOverlayBridge() {
  const t = await getTranslations("cart");
  return <CartOverlay description={t("reviewCartDescription")} title={t("shoppingCart")} />;
}
