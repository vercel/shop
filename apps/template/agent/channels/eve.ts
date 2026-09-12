import { getCartId } from "@shopify/hydrogen";
import { checkBotId } from "botid/server";
import { disableRoute } from "eve/channels";
import { type AuthFn, ForbiddenError, localDev, none, vercelOidc } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

import { shopConfig } from "../../lib/config";

const anonymous = none<Request>();
const browserAuth: AuthFn<Request> = async (request) => {
  if (
    shopConfig.botid.isEnabled &&
    (
      await checkBotId({
        advancedOptions: {
          checkLevel: shopConfig.botid.checkLevel,
          headers: Object.fromEntries(request.headers.entries()),
        },
      })
    ).isBot
  )
    throw new ForbiddenError();
  return anonymous(request);
};

export default shopConfig.agent.isEnabled
  ? eveChannel({
      auth: [vercelOidc(), localDev(), browserAuth],
      onMessage({ eve }) {
        const caller = eve.caller;
        if (!caller) return { auth: null };
        const cartId = getCartId({ cookie: eve.request.headers.get("cookie") ?? undefined });
        return {
          auth: { ...caller, attributes: { ...caller.attributes, ...(cartId ? { cartId } : {}) } },
        };
      },
      turnPolicy: "queue",
      uploadPolicy: "disabled",
    })
  : disableRoute();
