import { type BotIdCheckLevel, shopConfig } from "@/shop.config";

export interface BotIdProtectedRoute {
  advancedOptions: { checkLevel: BotIdCheckLevel };
  method: string;
  path: string;
}

export const BOTID_DENIED_CODE = "botid_denied";

export const isBotIdEnabled = shopConfig.botid.enabled;

// The client `protect` entry and the server `checkBotId()` call must declare the same checkLevel or verification fails.
export const botIdCheckOptions = {
  advancedOptions: { checkLevel: shopConfig.botid.checkLevel },
};

export const botIdProtectedRoutes: BotIdProtectedRoute[] = shopConfig.agent.enabled
  ? [
      {
        advancedOptions: { checkLevel: shopConfig.botid.checkLevel },
        method: "POST",
        path: "/api/chat",
      },
    ]
  : [];
