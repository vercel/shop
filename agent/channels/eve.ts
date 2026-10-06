import { getCartId } from "@shopify/hydrogen";
import { checkBotId } from "botid/server";
import { disableRoute } from "eve/channels";
import { type AuthFn, ForbiddenError, localDev, none, vercelOidc } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

import { readAgentBrowserId, toAgentBrowserPrincipalId } from "../../lib/agent/browser/server";
import { shopConfig } from "../../lib/config";

const anonymous = none<Request>();
const browserAuth: AuthFn<Request> = async (request) => {
  // Agent info exposes compiled instructions and tool config, so only operators may read it.
  if (new URL(request.url).pathname.endsWith("/eve/v1/info")) return null;
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
  const browserId = readAgentBrowserId(request.headers.get("cookie"));
  if (!browserId) return anonymous(request);
  return {
    attributes: {},
    authenticator: "shop-browser",
    principalId: toAgentBrowserPrincipalId(browserId),
    principalType: "anonymous",
  };
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
