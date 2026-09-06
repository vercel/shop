import { shopConfig } from "@/lib/config";

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
