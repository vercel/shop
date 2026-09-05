import { CartNotifications } from "./notifications";
import { CartOverlayBridge } from "./overlay-bridge";

export function CartUI() {
  return (
    <>
      <CartNotifications />
      <CartOverlayBridge />
    </>
  );
}
