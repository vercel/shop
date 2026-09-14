import { shopConfig } from "@/lib/config";

export const botIdProtectedRoutes = [
  ...(shopConfig.agent.isEnabled
    ? [
        {
          advancedOptions: { checkLevel: shopConfig.botid.checkLevel },
          method: "POST",
          path: "/api/agent/session",
        },
        {
          advancedOptions: { checkLevel: shopConfig.botid.checkLevel },
          method: "*",
          path: "/eve/v1/session",
        },
        {
          advancedOptions: { checkLevel: shopConfig.botid.checkLevel },
          method: "*",
          path: "/eve/v1/session/*",
        },
      ]
    : []),
];
