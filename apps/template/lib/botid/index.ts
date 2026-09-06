import { shopConfig } from "@/lib/config";

// The client `protect` entry and the server `checkBotId()` call must declare the same checkLevel or verification fails.
export const botIdCheckOptions = {
  advancedOptions: { checkLevel: shopConfig.botid.checkLevel },
};

export const botIdProtectedRoutes = [
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
