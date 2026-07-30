import { initBotId } from "botid/client/core";

import { botIdProtectedRoutes } from "@/lib/botid";
import { shopConfig } from "@/lib/config";

if (shopConfig.botid.isEnabled && botIdProtectedRoutes.length > 0) {
  initBotId({ protect: botIdProtectedRoutes });
}
