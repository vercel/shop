import { CartOverlay } from "./overlay";

export async function CartOverlayWithAddress({ locale }: { locale: string }) {
  return <CartOverlay locale={locale} />;
}
