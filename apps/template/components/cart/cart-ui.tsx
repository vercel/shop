import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { CartNotifications } from "./notifications";
import { CartOverlayBridge } from "./overlay-bridge";

export async function CartUI() {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={{ cart: messages.cart }}>
      <CartNotifications />
      <CartOverlayBridge />
    </NextIntlClientProvider>
  );
}
