import { type BotIdCheckLevel, shopConfig } from "@/lib/config";

export interface BotIdProtectedRoute {
  advancedOptions: { checkLevel: BotIdCheckLevel };
  method: string;
  path: string;
}

export const BOTID_DENIED_CODE = "botid_denied";

// The client `protect` entry and the server `checkBotId()` call must declare the same checkLevel or verification fails.
export const botIdCheckOptions = {
  advancedOptions: { checkLevel: shopConfig.botid.checkLevel },
};

export const botIdProtectedRoutes: BotIdProtectedRoute[] = [
  // The cart route fronts every Shopify cart mutation, so it's protected whenever
  // BotID is on — independent of the agent. The webhook route is excluded: Shopify's
  // own servers call it and would fail bot detection.
  {
    advancedOptions: { checkLevel: shopConfig.botid.checkLevel },
    method: "POST",
    path: "/api/cart",
  },
  ...(shopConfig.agent.isEnabled
    ? [
        {
          advancedOptions: { checkLevel: shopConfig.botid.checkLevel },
          method: "POST",
          path: "/api/chat",
        },
      ]
    : []),
];
